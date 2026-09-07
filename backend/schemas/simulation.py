"""
Simulation Schemas for FedSentinel-Health
Pydantic models for operator-controlled attack simulation, target node selection, and defense toggles.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from backend.core.constants import AttackType


class AttackSimulationRequest(BaseModel):
    target_client_id: str = Field(default="H3", description="Specific hospital node to simulate attack on (e.g. H1, H2, H3, H4, H5)")
    target_client_ids: Optional[List[str]] = Field(default=None, description="Optional multiple colluding target nodes")
    attack_type: AttackType = Field(default=AttackType.MODEL_POISONING, description="Attack vector to simulate")
    intensity: float = Field(default=0.75, ge=0.1, le=1.0, description="Attack magnitude / intensity [0.1 - 1.0]")
    poison_ratio: float = Field(default=0.5, ge=0.05, le=1.0, description="Fraction of local batch/labels corrupted")
    defense_enabled: bool = Field(default=True, description="Whether Zero-Trust defense gateway is active")


class SimulationStartRequest(BaseModel):
    scenario: Optional[str] = "medical_imaging_poisoning"
    target_client_id: Optional[str] = "H3"
    target_clients: Optional[List[str]] = None
    attack_type: Optional[str] = "model_poisoning"
    intensity: Optional[float] = 0.75
    defense_enabled: Optional[bool] = True
    num_rounds: Optional[int] = 5


class DefenseToggleRequest(BaseModel):
    enabled: bool = Field(..., description="Enable or disable Zero-Trust gateway defense")
    strategy: Optional[str] = Field(default="trust_weighted", description="fedavg | trust_weighted | trimmed_mean")
    auto_quarantine: Optional[bool] = Field(default=True, description="Automatically quarantine nodes when trust drops below threshold")


class SimulationStateResponse(BaseModel):
    is_simulating: bool
    phase: str
    target_client_id: str
    attack_type: str
    defense_enabled: bool
    current_round: int
    global_accuracy: float
