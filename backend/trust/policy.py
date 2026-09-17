"""
Trust Policy Management and Versioning Engine for FedSentinel-Health
Defines configurable, version-tracked security policies for multi-signal trust scoring.
Enforces the mathematical invariant that penalty weights sum to 1.0.
"""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, Optional
from datetime import datetime, timezone


class TrustPolicy(BaseModel):
    """
    Versioned Trust Policy governing trust penalties and quarantine thresholds.
    Every federation round records the policy_version used for full decision reproducibility.
    """
    policy_id: str = "POL-DEFAULT-2026"
    version: str = "1.0.0"
    description: str = "Default zero-trust clinical federated learning defense policy"
    
    # Mathematical Weights: Must sum to 1.0
    w_anomaly: float = Field(0.35, description="Weight for spatial gradient anomaly (A_i)")
    w_influence: float = Field(0.25, description="Weight for counterfactual model degradation (I_i)")
    w_history: float = Field(0.20, description="Weight for historical EMA anomaly track record (H_i)")
    w_robustness: float = Field(0.10, description="Weight for perturbation prediction stability (R_i)")
    w_contribution: float = Field(0.10, description="Weight for group attribution alignment (C_i)")

    # Decision Thresholds (0-100 scale)
    quarantine_threshold: float = Field(50.0, description="Scores at or below this trigger automatic node quarantine")
    suspicious_threshold: float = Field(75.0, description="Scores between quarantine and this trigger administrative review")
    
    # Anomaly Amplification
    severe_anomaly_cutoff: float = Field(0.45, description="Anomaly score above this receives non-linear penalty amplification")
    severe_anomaly_floor: float = Field(0.65, description="Minimum penalty applied if severe anomaly detected")

    effective_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str = "SYSTEM_SECOPS_ADMIN"

    @field_validator("w_contribution")
    @classmethod
    def validate_weights_sum(cls, v: float, info) -> float:
        """Validates that all composite weights sum to exactly 1.0 (+/- float tolerance)."""
        data = info.data
        w_a = data.get("w_anomaly", 0.35)
        w_i = data.get("w_influence", 0.25)
        w_h = data.get("w_history", 0.20)
        w_r = data.get("w_robustness", 0.10)
        total = round(w_a + w_i + w_h + w_r + v, 4)
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Trust policy weights must sum to 1.0! Current sum: {total}")
        return v


DEFAULT_TRUST_POLICY = TrustPolicy()

POLICY_REGISTRY: Dict[str, TrustPolicy] = {
    "1.0.0": DEFAULT_TRUST_POLICY,
    "1.1.0-STRICT": TrustPolicy(
        policy_id="POL-STRICT-2026",
        version="1.1.0-STRICT",
        description="Strict Zero-Trust policy with heightened quarantine threshold (60.0%)",
        w_anomaly=0.40,
        w_influence=0.25,
        w_history=0.15,
        w_robustness=0.10,
        w_contribution=0.10,
        quarantine_threshold=60.0,
        suspicious_threshold=80.0,
    ),
}
