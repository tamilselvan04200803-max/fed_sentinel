"""
Dynamic Trust Engine for FedSentinel-Health
Calculates multi-signal composite trust score T_i:
T_i = 100 * (1 - [w_A*A_i + w_I*I_i + w_C*C_i + w_R*R_i + w_H*Hist_i])
Maintains dynamic trust states and calculates operational aggregation weights.
"""

from typing import Dict, Any, Tuple, Optional
from datetime import datetime, timezone
from backend.core.config import settings
from backend.core.constants import TrustState, ClientStatus
from backend.schemas.trust import TrustScore
from backend.trust.history import TrustHistoryTracker
from backend.trust.policy import TrustPolicy, DEFAULT_TRUST_POLICY


class TrustEngine:
    """Computes multi-dimensional trust scores and determines node quarantine states."""

    def __init__(
        self,
        policy: Optional[TrustPolicy] = None,
        w_anomaly: Optional[float] = None,
        w_influence: Optional[float] = None,
        w_history: Optional[float] = None,
        w_robustness: Optional[float] = None,
        w_contribution: Optional[float] = None,
        quarantine_threshold: Optional[float] = None,
        suspicious_threshold: Optional[float] = None,
    ):
        self.policy = policy or DEFAULT_TRUST_POLICY
        self.w_a = w_anomaly if w_anomaly is not None else self.policy.w_anomaly
        self.w_i = w_influence if w_influence is not None else self.policy.w_influence
        self.w_h = w_history if w_history is not None else self.policy.w_history
        self.w_r = w_robustness if w_robustness is not None else self.policy.w_robustness
        self.w_c = w_contribution if w_contribution is not None else self.policy.w_contribution
        
        q_thresh = quarantine_threshold if quarantine_threshold is not None else self.policy.quarantine_threshold
        s_thresh = suspicious_threshold if suspicious_threshold is not None else self.policy.suspicious_threshold
        # Normalize to 0-100 scale if provided as fractional [0, 1]
        self.quarantine_thresh = q_thresh * 100.0 if q_thresh <= 1.0 else q_thresh
        self.suspicious_thresh = s_thresh * 100.0 if s_thresh <= 1.0 else s_thresh
        
        self.history_tracker = TrustHistoryTracker()
        self.observation_clients: set[str] = set()

    def set_policy(self, policy: TrustPolicy) -> None:
        """Updates active trust policy."""
        self.policy = policy
        self.w_a = policy.w_anomaly
        self.w_i = policy.w_influence
        self.w_h = policy.w_history
        self.w_r = policy.w_robustness
        self.w_c = policy.w_contribution
        self.quarantine_thresh = policy.quarantine_threshold
        self.suspicious_thresh = policy.suspicious_threshold

    def compute_trust(
        self,
        client_id: str,
        anomaly_score: float,
        influence_score: float = 0.0,
        attribution_score: float = 0.0,
        robustness_score: float = 0.0,
        norm_ratio: Optional[float] = None,
        is_free_rider: bool = False,
        loss_delta: float = 0.0,
    ) -> TrustScore:
        """
        Computes multi-signal composite trust score for a node in the current round.
        Disentangles Security Cleanliness from Contribution Integrity and Participation Reliability.
        Penalizes Free-Riders (norm_ratio < 0.05) to eliminate trust inflation on zero-utility updates.
        """
        # Update EMA historical anomaly
        hist_val = self.history_tracker.update_history(client_id, anomaly_score)

        # Influence penalty is triggered when leave-one-out degradation occurs
        inf_penalty = max(0.0, min(1.0, influence_score * 5.0))

        # Robustness penalty: 1.0 - robustness_score (0.0 when perfectly robust)
        rob_penalty = max(0.0, min(1.0, 1.0 - robustness_score))

        # Non-linear severe anomaly amplification for zero-trust enforcement
        anomaly_penalty = min(1.0, anomaly_score * 1.8) if anomaly_score > 0.45 else anomaly_score * 0.4

        # Contribution Integrity & Free-Rider Detection
        # If gradient update norm is less than 5% of cohort median, node is a Free-Rider
        if is_free_rider or (norm_ratio is not None and norm_ratio < 0.05):
            is_free_rider = True
            contrib_penalty = 0.85  # Severe penalty for failing contribution utility
            contrib_integrity = max(1.0, min(15.0, (norm_ratio if norm_ratio is not None else 0.001) / 0.05 * 15.0))
        elif norm_ratio is not None:
            effective_norm = min(1.0, max(0.0, norm_ratio))
            contrib_penalty = max(0.0, min(1.0, 1.0 - effective_norm))
            contrib_integrity = round(100.0 * (1.0 - contrib_penalty), 1)
        else:
            contrib_penalty = attribution_score
            contrib_integrity = round(100.0 * (1.0 - max(0.0, min(1.0, attribution_score))), 1)

        # Security Cleanliness (Sub-signal 1)
        sec_penalty = min(1.0, 0.50 * anomaly_penalty + 0.30 * inf_penalty + 0.20 * rob_penalty)
        security_cleanliness = float(round(100.0 * (1.0 - sec_penalty), 1))

        # Participation Reliability (Sub-signal 3)
        participation_reliability = float(round(100.0 * (1.0 - min(1.0, hist_val)), 1))

        # Composite penalty calculation
        penalty = (
            self.w_a * anomaly_penalty +
            self.w_i * inf_penalty +
            self.w_c * contrib_penalty +
            self.w_r * rob_penalty +
            self.w_h * hist_val
        )
        if anomaly_score > 0.6:
            penalty = max(0.72, penalty)
        
        # Free-rider penalty floor: ensures score drops below acceptable operational threshold
        if is_free_rider:
            penalty = max(0.58, penalty)

        penalty = max(0.0, min(1.0, penalty))

        # Trust score in [0, 100]
        raw_score = 100.0 * (1.0 - penalty)
        score = float(round(raw_score, 1))

        # State determination
        # Cold start check: if rounds completed < 3, mark OBSERVATION unless quarantined
        is_observation = client_id in self.observation_clients
        if score <= self.quarantine_thresh:
            state = TrustState.QUARANTINED.value
        elif score <= self.suspicious_thresh or is_free_rider:
            state = TrustState.SUSPICIOUS.value
        elif is_observation:
            state = "OBSERVATION"
        else:
            state = TrustState.TRUSTED.value

        return TrustScore(
            client_id=client_id,
            score=score,
            anomaly_component=round(anomaly_score, 4),
            influence_component=round(inf_penalty, 4),
            history_component=round(hist_val, 4),
            robustness_component=round(robustness_score, 4),
            contribution_component=round(contrib_penalty, 4),
            security_cleanliness=security_cleanliness,
            contribution_integrity=contrib_integrity,
            participation_reliability=participation_reliability,
            is_free_rider=is_free_rider,
            norm_ratio=round(norm_ratio, 4) if norm_ratio is not None else None,
            state=state,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def calculate_aggregation_weights(self, trust_scores: Dict[str, TrustScore], defense_enabled: bool = True) -> Dict[str, float]:
        """
        Computes normalized aggregation weights q_hat_i = q_i / sum(q_j).
        Quarantined clients AND Free-Riders receive weight = 0.0 when defense is enabled.
        Cold-Start Observation nodes have their raw weight capped at 50% max during monitoring.
        """
        weights: Dict[str, float] = {}

        if not defense_enabled:
            # Equal weighting (FedAvg) without Zero-Trust filtering
            n = len(trust_scores)
            return {cid: 1.0 / max(n, 1) for cid in trust_scores}

        total_trust = 0.0
        for cid, ts in trust_scores.items():
            if ts.state == TrustState.QUARANTINED.value or ts.score <= self.quarantine_thresh or ts.is_free_rider:
                w = 0.0
            elif ts.state == "OBSERVATION":
                w = (ts.score / 100.0) * 0.50  # Cap observation nodes at 50% max weight
            else:
                # Quadratic weighting rewards high-trust clients
                w = (ts.score / 100.0) ** 2
            weights[cid] = w
            total_trust += w

        # Normalize
        if total_trust > 1e-6:
            for cid in weights:
                weights[cid] = round(weights[cid] / total_trust, 4)
        else:
            # Fallback if all nodes are compromised
            n = len(trust_scores)
            for cid in weights:
                weights[cid] = 1.0 / max(n, 1)

        return weights
