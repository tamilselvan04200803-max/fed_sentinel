"""
SQLAlchemy ORM Models for FedSentinel-Health
Entities for hospital clients, rounds, updates, detections, incidents, and audit logs.
"""

from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.db.database import Base
from datetime import datetime, timezone


class ClientModel(Base):
    __tablename__ = "clients"

    client_id = Column(String(16), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    status = Column(String(32), default="ACTIVE")
    trust_score = Column(Float, default=95.0)
    anomaly_score = Column(Float, default=0.05)
    samples_count = Column(Integer, default=1000)
    historical_anomalies = Column(Integer, default=0)
    last_active_round = Column(Integer, default=1)
    enclave_type = Column(String(64), default="Intel SGX Enclave")
    department = Column(String(128), default="General Clinical Research")
    contribution_weight = Column(Float, default=0.20)
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class RoundModel(Base):
    __tablename__ = "federation_rounds"

    round_id = Column(Integer, primary_key=True, index=True)
    status = Column(String(32), default="COMPLETED")
    participating_clients_json = Column(Text, default="[]")
    quarantined_clients_json = Column(Text, default="[]")
    accepted_clients_json = Column(Text, default="[]")
    global_accuracy = Column(Float, default=0.0)
    global_loss = Column(Float, default=0.0)
    aggregation_strategy = Column(String(32), default="trust_weighted")
    duration_ms = Column(Float, default=0.0)
    client_metrics_json = Column(Text, default="{}")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class IncidentModel(Base):
    __tablename__ = "incidents"

    incident_id = Column(String(32), primary_key=True, index=True)
    client_id = Column(String(16), index=True)
    round_id = Column(Integer, index=True)
    severity = Column(String(16), default="CRITICAL")
    anomaly_score = Column(Float, default=0.0)
    trust_score = Column(Float, default=0.0)
    threat_hypothesis = Column(String(64), default="MODEL_POISONING")
    decision = Column(String(32), default="QUARANTINED")
    aggregation_weight = Column(Float, default=0.0)
    affected_model_version = Column(String(32), default="global-model-v1")
    evidence_json = Column(Text, default="[]")
    evidence_summary_json = Column(Text, default="{}")
    blast_radius_json = Column(Text, default="{}")
    recommended_action = Column(Text, default="")
    status = Column(String(32), default="OPEN")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    actor = Column(String(64), default="SYSTEM_SECOPS")
    action = Column(String(64), nullable=False)
    client_id = Column(String(16), nullable=True)
    round_id = Column(Integer, nullable=True)
    severity = Column(String(16), default="INFO")
    metadata_json = Column(Text, default="{}")
