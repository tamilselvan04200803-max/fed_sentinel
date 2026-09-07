"""
Detection Result and Evidence Schemas for FedSentinel-Health
Pydantic models for multi-layer security validation and evidence items.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class EvidenceItem(BaseModel):
    layer: str = Field(..., description="L0 | L1 | L2 | INFLUENCE | ATTRIBUTION | ROBUSTNESS")
    signal: str = Field(..., description="Signal identifier (e.g. cosine_to_root, gradient_norm)")
    value: float
    threshold: float
    status: str = Field(..., description="PASS | WARN | FAIL")
    description: str


class DetectionResult(BaseModel):
    detection_id: str
    client_id: str
    round_id: int
    anomaly_score: float = Field(..., ge=0.0, le=1.0)
    direction_anomaly: float = Field(default=0.0, ge=0.0, le=1.0)
    magnitude_anomaly: float = Field(default=0.0, ge=0.0, le=1.0)
    peer_anomaly: float = Field(default=0.0, ge=0.0, le=1.0)
    label_anomaly: float = Field(default=0.0, ge=0.0, le=1.0)
    decision: str = Field(..., description="ACCEPT | SUSPICIOUS | QUARANTINE")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    signals: List[EvidenceItem] = Field(default_factory=list)
    timestamp: str = ""
