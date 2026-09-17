"""
Client Schemas for FedSentinel-Health
Pydantic models for hospital client registry and operational actions.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class HospitalClient(BaseModel):
    client_id: str = Field(..., description="Unique client identifier (e.g. H1, H2)")
    name: str = Field(..., description="Full hospital or clinical institution name")
    status: str = Field(default="ACTIVE", description="ACTIVE | TRAINING | SUSPICIOUS | QUARANTINED | OFFLINE")
    trust_score: float = Field(default=95.0, ge=0.0, le=100.0, description="Trust score [0-100]")
    anomaly_score: float = Field(default=0.05, ge=0.0, le=1.0, description="Anomaly score [0-1]")
    samples_count: int = Field(default=1000, ge=0, description="Number of private local training samples")
    historical_anomalies: int = Field(default=0, ge=0, description="Cumulative count of anomalous events")
    last_active_round: int = Field(default=1, ge=0, description="Most recent federation round active")
    enclave_type: Optional[str] = Field(default="Intel SGX Enclave", description="Hardware attestation enclave")
    department: Optional[str] = Field(default="Pulmonology & Radiology", description="Clinical department cohort")
    disease_cohort: Optional[str] = Field(default="PNEUMONIA", description="PNEUMONIA | GLIOBLASTOMA")
    contribution_weight: float = Field(default=0.20, ge=0.0, le=1.0, description="Effective aggregation weight")
    registered_at: Optional[str] = None
    last_seen: Optional[str] = None


class CreateClientRequest(BaseModel):
    client_id: str = Field(..., min_length=2, max_length=16)
    name: str = Field(..., min_length=3, max_length=128)
    status: Optional[str] = "TRUSTED"
    trust_score: Optional[float] = 95.0
    samples_count: Optional[int] = 1000
    enclave_type: Optional[str] = "Intel SGX Enclave"
    department: Optional[str] = "General Clinical Research"
    disease_cohort: Optional[str] = "PNEUMONIA"


class UpdateClientRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    trust_score: Optional[float] = None
    samples_count: Optional[int] = None
    enclave_type: Optional[str] = None
    department: Optional[str] = None
    disease_cohort: Optional[str] = None


class ClientActionRequest(BaseModel):
    action: str = Field(..., description="REINSTATE | QUARANTINE | BLOCK | ADJUST_TRUST")
    trust_score: Optional[float] = None
    reason: Optional[str] = None


class ClientTrustHistoryItem(BaseModel):
    round_id: int
    score: float
    delta: float
    reason: str
    timestamp: str


class ClientDetailResponse(BaseModel):
    client: HospitalClient
    trust_history: List[ClientTrustHistoryItem] = []
    incident_count: int = 0
    recent_detections: List[dict] = []
