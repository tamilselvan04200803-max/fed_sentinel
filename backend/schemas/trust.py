"""
Trust Engine Schemas for FedSentinel-Health
Pydantic models for composite trust score calculations and historical metrics.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class TrustScore(BaseModel):
    client_id: str
    score: float = Field(..., ge=0.0, le=100.0)
    anomaly_component: float = Field(default=0.0, ge=0.0, le=1.0)
    influence_component: float = Field(default=0.0, ge=0.0, le=1.0)
    history_component: float = Field(default=0.0, ge=0.0, le=1.0)
    robustness_component: float = Field(default=0.0, ge=0.0, le=1.0)
    contribution_component: float = Field(default=0.0, ge=0.0, le=1.0)
    state: str = Field(default="TRUSTED", description="TRUSTED | SUSPICIOUS | QUARANTINED")
    timestamp: str = ""


class TrustOverviewResponse(BaseModel):
    clients: List[TrustScore]
    mean_trust_score: float
    quarantined_count: int
    suspicious_count: int
    defense_enabled: bool
