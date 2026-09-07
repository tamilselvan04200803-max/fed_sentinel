"""
Client Update and Fingerprint Schemas for FedSentinel-Health
Pydantic models for model weights update metadata, privacy-safe fingerprints, and Layer 0/1 data.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class LayerStatistics(BaseModel):
    layer_name: str
    l2_norm: float
    mean: float
    std: float
    skew: float
    kurtosis: float


class UpdateFingerprint(BaseModel):
    update_norm: float
    cosine_to_root: float
    peer_similarity: float
    layer_norms: List[float] = Field(default_factory=list)
    layer_statistics: List[LayerStatistics] = Field(default_factory=list)
    random_projection: List[float] = Field(default_factory=list)
    sparsity: float = 0.0
    fingerprint_hash: str = ""


class ClientUpdateMetadata(BaseModel):
    client_id: str
    round_id: int
    model_version: str
    sample_count: int
    update_norm: float
    cosine_to_root: float
    peer_similarity: float
    local_accuracy: float
    local_loss: float
    training_time_ms: float
    fingerprint: Optional[UpdateFingerprint] = None
    validation_passed: bool = True
