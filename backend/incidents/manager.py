"""
Incident Response Manager for FedSentinel-Health
Creates and maintains incident records, forensic evidence packages, and audit trails.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from backend.schemas.incidents import Incident, BlastRadius, AuditEvent
from backend.schemas.detections import DetectionResult
from backend.schemas.trust import TrustScore
from backend.core.constants import Severity, IncidentDecision


class IncidentManager:
    """Manages active security incidents and evidence chains."""

    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self.incident_counter = 1

    def create_incident(
        self,
        round_id: int,
        client_id: str,
        detection: DetectionResult,
        trust_before: float,
        trust_after: float,
        evidence_items: List[Dict[str, Any]],
        threat_hypothesis: str = "MODEL_POISONING",
        blast_radius: Optional[BlastRadius] = None,
    ) -> Incident:
        """Creates a standardized cybersecurity incident record."""
        inc_id = f"INC-2026-{self.incident_counter:03d}"
        self.incident_counter += 1

        severity = Severity.CRITICAL.value if detection.anomaly_score > 0.7 else Severity.HIGH.value
        decision = IncidentDecision.QUARANTINED.value if trust_after <= 30.0 else IncidentDecision.FLAGGED.value

        evidence_summary = {
            "layer0_local_validation": {
                "status": "FLAGGED" if any(s.get("layer") == "L0" and s.get("status") != "PASS" for s in evidence_items) else "VERIFIED",
                "format_valid": True,
            },
            "layer1_fingerprint": {
                "cosine_distance_to_median": round(detection.direction_anomaly, 4),
                "norm_z_score": round(detection.magnitude_anomaly, 4),
            },
            "layer2_anomaly": {
                "anomaly_score": round(detection.anomaly_score, 4),
                "direction_anomaly": round(detection.direction_anomaly, 4),
                "magnitude_anomaly": round(detection.magnitude_anomaly, 4),
                "peer_anomaly": round(detection.peer_anomaly, 4),
            },
            "trust_engine": {
                "trust_before": round(trust_before, 1),
                "trust_after": round(trust_after, 1),
                "recommended_action": "QUARANTINE_NODE_IMMEDIATELY" if decision == "QUARANTINED" else "MONITOR_NEXT_ROUND",
            }
        }

        rec_action = (
            f"Zero-Trust Gateway has automatically quarantined {client_id}. "
            f"Weight set to 0.0%. Node requires administrative audit and enclave re-attestation before reinstatement."
        )

        incident = Incident(
            incident_id=inc_id,
            client_id=client_id,
            round_id=round_id,
            severity=severity,
            anomaly_score=round(detection.anomaly_score, 4),
            trust_score=round(trust_after, 1),
            threat_hypothesis=threat_hypothesis,
            decision=decision,
            aggregation_weight=0.0,
            affected_model_version=f"global-model-v{round_id}",
            evidence=evidence_items,
            evidence_summary=evidence_summary,
            blast_radius=blast_radius or BlastRadius(),
            recommended_action=rec_action,
            timestamp=datetime.now(timezone.utc).isoformat(),
            status="OPEN",
        )

        self.incidents[inc_id] = incident
        return incident

    def get_all(self) -> List[Incident]:
        return list(self.incidents.values())

    def get_by_id(self, incident_id: str) -> Optional[Incident]:
        return self.incidents.get(incident_id)

    def resolve_incident(self, incident_id: str, new_status: str = "RESOLVED") -> Optional[Incident]:
        if incident_id in self.incidents:
            self.incidents[incident_id].status = new_status
            return self.incidents[incident_id]
        return None
