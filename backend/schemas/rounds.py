"""
Federation Round Schemas for FedSentinel-Health
Pydantic models for round lifecycle, client participation, and aggregation metrics.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class FederationRound(BaseModel):
    round_id: int = Field(..., ge=0)
    status: str = Field(default="COMPLETED", description="PENDING | TRAINING | VALIDATING | AGGREGATING | COMPLETED | FAILED")
    participating_clients: List[str] = Field(default_factory=list)
    quarantined_clients: List[str] = Field(default_factory=list)
    accepted_clients: List[str] = Field(default_factory=list)
    global_accuracy: float = Field(default=0.0, ge=0.0, le=1.0)
    global_loss: float = Field(default=0.0, ge=0.0)
    aggregation_strategy: str = Field(default="trust_weighted")
    duration_ms: float = Field(default=0.0)
    timestamp: str = ""
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    client_metrics: Optional[Dict[str, Dict[str, Any]]] = None


class StartRoundRequest(BaseModel):
    round_id: Optional[int] = None
    target_clients: Optional[List[str]] = None
    epochs: Optional[int] = None
    batch_size: Optional[int] = None
    aggregation_strategy: Optional[str] = "trust_weighted"
