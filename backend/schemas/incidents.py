"""
Incident and Audit Schemas for FedSentinel-Health
Pydantic models for cybersecurity incidents, blast radius, forensic evidence, and audit logs.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class BlastRadius(BaseModel):
    baseline_asr: Optional[float] = 0.02
    post_update_asr: Optional[float] = 0.88
    baseline_accuracy: Optional[float] = 0.94
    post_update_accuracy: Optional[float] = 0.72
    impacted_target_class: Optional[str] = "Pneumonia / Pathological"
    target_class_accuracy_drop: Optional[float] = 0.22


class Incident(BaseModel):
    incident_id: str
    client_id: str
    round_id: int
    severity: str = Field(..., description="CRITICAL | HIGH | MEDIUM | LOW | INFO")
    anomaly_score: float
    trust_score: float
    threat_hypothesis: str = "MODEL_POISONING"
    decision: str = Field(..., description="QUARANTINED | FLAGGED | CLEARED")
    aggregation_weight: float = 0.0
    affected_model_version: str = "global-model-v1"
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    evidence_summary: Optional[Dict[str, Any]] = None
    blast_radius: Optional[BlastRadius] = None
    recommended_action: str = ""
    timestamp: str = ""
    status: str = "OPEN"  # OPEN | INVESTIGATING | RESOLVED | REINSTATED


class AuditEvent(BaseModel):
    event_id: str
    timestamp: str
    actor: str = "SYSTEM_SECOPS"
    action: str
    client_id: Optional[str] = None
    round_id: Optional[int] = None
    severity: str = "INFO"
    metadata: Dict[str, Any] = Field(default_factory=dict)
