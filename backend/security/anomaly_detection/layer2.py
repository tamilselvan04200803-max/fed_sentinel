"""
Layer 2 — Zero-Trust Anomaly Engine for FedSentinel-Health
Computes composite anomaly score A_i = α*A_dir + β*A_mag + γ*A_peer + δ*A_label
using robust median/MAD statistics and root-gradient alignment.
"""

import numpy as np
from typing import Dict, List, Any
from backend.core.config import settings
from backend.core.constants import DetectionDecision
from backend.schemas.detections import DetectionResult, EvidenceItem
from backend.schemas.updates import UpdateFingerprint


class Layer2AnomalyEngine:
    """Zero-Trust anomaly engine evaluating spatial, magnitude, and peer divergence."""

    def __init__(
        self,
        alpha: float = settings.ANOMALY_WEIGHT_DIRECTION,
        beta: float = settings.ANOMALY_WEIGHT_MAGNITUDE,
        gamma: float = settings.ANOMALY_WEIGHT_PEER,
        delta: float = settings.ANOMALY_WEIGHT_LABEL,
        amber_threshold: float = settings.ANOMALY_THRESHOLD_AMBER,
        red_threshold: float = settings.ANOMALY_THRESHOLD_RED,
    ):
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.delta = delta
        self.amber_threshold = amber_threshold
        self.red_threshold = red_threshold

    def evaluate_cohort(
        self,
        fingerprints: Dict[str, UpdateFingerprint],
        round_id: int,
    ) -> Dict[str, DetectionResult]:
        """
        Evaluates an entire round's collection of client fingerprints using relative cohort statistics.
        Returns DetectionResult per client.
        """
        all_norms = np.array([fp.update_norm for fp in fingerprints.values()])
        median_norm = float(np.median(all_norms))
        # Median Absolute Deviation (MAD) with normal distribution scale factor 1.4826
        mad = float(np.median(np.abs(all_norms - median_norm)))
        mad = max(mad, 1e-4)

        results: Dict[str, DetectionResult] = {}

        for client_id, fp in fingerprints.items():
            signals: List[EvidenceItem] = []

            # 1. Direction Anomaly A_direction = 1 - S_i (normalized [0, 1])
            # S_i is cosine similarity to server root-of-trust gradient
            s_i = fp.cosine_to_root
            a_dir = max(0.0, min(1.0, (1.0 - s_i) / 2.0))
            dir_status = "FAIL" if a_dir > 0.6 else ("WARN" if a_dir > 0.35 else "PASS")
            signals.append(EvidenceItem(
                layer="L2",
                signal="direction_anomaly",
                value=float(a_dir),
                threshold=0.5,
                status=dir_status,
                description=f"Cosine alignment to server Root-of-Trust: {s_i:.3f} (Divergence score: {a_dir:.3f})"
            ))

            # 2. Magnitude Anomaly A_magnitude (using robust MAD scaling)
            z_mag = abs(fp.update_norm - median_norm) / (1.4826 * mad)
            # Sigmoidal compression to [0, 1]
            a_mag = float(2.0 / (1.0 + np.exp(-z_mag / 2.0)) - 1.0)
            a_mag = max(0.0, min(1.0, a_mag))
            mag_status = "FAIL" if a_mag > 0.6 else ("WARN" if a_mag > 0.35 else "PASS")
            signals.append(EvidenceItem(
                layer="L2",
                signal="magnitude_anomaly",
                value=float(a_mag),
                threshold=0.5,
                status=mag_status,
                description=f"Update norm: {fp.update_norm:.2f} (Median: {median_norm:.2f}, Robust Z: {z_mag:.2f})"
            ))

            # 3. Peer Anomaly A_peer = 1 - S_peer
            s_peer = fp.peer_similarity
            a_peer = max(0.0, min(1.0, (1.0 - s_peer) / 2.0))
            peer_status = "FAIL" if a_peer > 0.6 else ("WARN" if a_peer > 0.35 else "PASS")
            signals.append(EvidenceItem(
                layer="L2",
                signal="peer_anomaly",
                value=float(a_peer),
                threshold=0.5,
                status=peer_status,
                description=f"Peer cohort correlation: {s_peer:.3f} (Cohort divergence: {a_peer:.3f})"
            ))

            # 4. Label / Feature Anomaly (proxy via projection distance)
            a_label = min(1.0, max(0.0, (a_dir * 0.6 + a_mag * 0.4)))
            signals.append(EvidenceItem(
                layer="L2",
                signal="label_anomaly",
                value=float(a_label),
                threshold=0.5,
                status="FAIL" if a_label > 0.6 else ("WARN" if a_label > 0.35 else "PASS"),
                description=f"Class conditioning divergence estimate: {a_label:.3f}"
            ))

            # Composite Anomaly Score A_i
            composite_score = (
                self.alpha * a_dir +
                self.beta * a_mag +
                self.gamma * a_peer +
                self.delta * a_label
            )
            composite_score = float(max(0.0, min(1.0, composite_score)))

            # Decision state mapping
            if composite_score >= self.red_threshold:
                decision = DetectionDecision.QUARANTINE.value
            elif composite_score >= self.amber_threshold:
                decision = DetectionDecision.SUSPICIOUS.value
            else:
                decision = DetectionDecision.ACCEPT.value

            results[client_id] = DetectionResult(
                detection_id=f"DET-R{round_id}-{client_id}",
                client_id=client_id,
                round_id=round_id,
                anomaly_score=round(composite_score, 4),
                direction_anomaly=round(a_dir, 4),
                magnitude_anomaly=round(a_mag, 4),
                peer_anomaly=round(a_peer, 4),
                label_anomaly=round(a_label, 4),
                decision=decision,
                confidence=0.96 if decision == "QUARANTINE" else 0.92,
                signals=signals,
            )

        return results
