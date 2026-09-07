"""
Dynamic Trust Engine for FedSentinel-Health
Calculates multi-signal composite trust score T_i:
T_i = 100 * (1 - [w_A*A_i + w_I*I_i + w_C*C_i + w_R*R_i + w_H*Hist_i])
Maintains dynamic trust states and calculates operational aggregation weights.
"""

from typing import Dict, Any, Tuple
from datetime import datetime, timezone
from backend.core.config import settings
from backend.core.constants import TrustState, ClientStatus
from backend.schemas.trust import TrustScore
from backend.trust.history import TrustHistoryTracker


class TrustEngine:
    """Computes multi-dimensional trust scores and determines node quarantine states."""

    def __init__(
        self,
        w_anomaly: float = settings.TRUST_WEIGHT_ANOMALY,
        w_influence: float = settings.TRUST_WEIGHT_INFLUENCE,
        w_history: float = settings.TRUST_WEIGHT_HISTORY,
        w_robustness: float = settings.TRUST_WEIGHT_ROBUSTNESS,
        w_contribution: float = settings.TRUST_WEIGHT_CONTRIBUTION,
        quarantine_threshold: float = settings.TRUST_QUARANTINE_THRESHOLD,
        suspicious_threshold: float = settings.TRUST_SUSPICIOUS_THRESHOLD,
    ):
        self.w_a = w_anomaly
        self.w_i = w_influence
        self.w_h = w_history
        self.w_r = w_robustness
        self.w_c = w_contribution
        self.quarantine_thresh = quarantine_threshold * 100.0  # scale to 0-100
        self.suspicious_thresh = suspicious_threshold * 100.0
        self.history_tracker = TrustHistoryTracker()

    def compute_trust(
        self,
        client_id: str,
        anomaly_score: float,
        influence_score: float = 0.0,
        attribution_score: float = 0.0,
        robustness_score: float = 0.0,
    ) -> TrustScore:
        """
        Computes composite trust score for a node in the current round.
        Returns TrustScore schema.
        """
        # Update EMA historical anomaly
        hist_val = self.history_tracker.update_history(client_id, anomaly_score)

        # Influence penalty is triggered when leave-one-out improvement is positive
        inf_penalty = max(0.0, min(1.0, influence_score * 5.0))

        # Composite penalty calculation
        penalty = (
            self.w_a * anomaly_score +
            self.w_i * inf_penalty +
            self.w_c * attribution_score +
            self.w_r * robustness_score +
            self.w_h * hist_val
        )
        penalty = max(0.0, min(1.0, penalty))

        # Trust score in [0, 100]
        raw_score = 100.0 * (1.0 - penalty)
        score = float(round(raw_score, 1))

        # State determination
        if score <= self.quarantine_thresh:
            state = TrustState.QUARANTINED.value
        elif score <= self.suspicious_thresh:
            state = TrustState.SUSPICIOUS.value
        else:
            state = TrustState.TRUSTED.value

        return TrustScore(
            client_id=client_id,
            score=score,
            anomaly_component=round(anomaly_score, 4),
            influence_component=round(inf_penalty, 4),
            history_component=round(hist_val, 4),
            robustness_component=round(robustness_score, 4),
            contribution_component=round(attribution_score, 4),
            state=state,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def calculate_aggregation_weights(self, trust_scores: Dict[str, TrustScore], defense_enabled: bool = True) -> Dict[str, float]:
        """
        Computes normalized aggregation weights q_hat_i = q_i / sum(q_j).
        Quarantined clients receive weight = 0.0 when defense is enabled.
        """
        weights: Dict[str, float] = {}

        if not defense_enabled:
            # Equal weighting (FedAvg) without Zero-Trust filtering
            n = len(trust_scores)
            return {cid: 1.0 / max(n, 1) for cid in trust_scores}

        total_trust = 0.0
        for cid, ts in trust_scores.items():
            if ts.state == TrustState.QUARANTINED.value:
                weights[cid] = 0.0
            else:
                # Square weighting to reward high-trust clients
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
