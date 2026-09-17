"""
SQLAlchemy ORM Models for FedSentinel-Health
Enterprise Multi-Tenant Domain Schema: Organizations, Facilities, Users, Roles,
Federations, Models, Rounds, Security Assessments, Incidents, Appeals, Audit Events, and Subscriptions.
"""

from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from backend.db.database import Base
from datetime import datetime, timezone


# ── Existing Legacy Preserved Core Models ───────────────────────────────

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
    organization_id = Column(String(64), nullable=True)
    facility_id = Column(String(64), nullable=True)


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
    federation_id = Column(String(64), default="FED-HEALTH-NATIONAL-01")


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
    facility_id = Column(String(64), nullable=True)
    federation_id = Column(String(64), nullable=True)


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
    organization_id = Column(String(64), nullable=True)


# ── Multi-Tenant Domain Entities ───────────────────────────────────────

class OrganizationModel(Base):
    __tablename__ = "organizations"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    org_type = Column(String(64), default="HOSPITAL_NETWORK")  # HOSPITAL_NETWORK | HEALTH_TECH | RESEARCH_INSTITUTE | GOVERNMENT
    primary_contact_email = Column(String(128), nullable=False)
    state = Column(String(64), default="Pan-India")
    region = Column(String(64), default="National")
    subscription_plan = Column(String(32), default="ENTERPRISE")  # COMMUNITY | HOSPITAL | ENTERPRISE
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class FacilityModel(Base):
    __tablename__ = "facilities"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    hfr_reference_id = Column(String(64), unique=True, index=True)  # ABDM Health Facility Register ID
    specialty = Column(String(128), default="General Diagnostic Radiology")
    state = Column(String(64), nullable=False)
    district = Column(String(64), nullable=False)
    city = Column(String(64), nullable=False)
    latitude = Column(Float, default=20.5937)
    longitude = Column(Float, default=78.9629)
    status = Column(String(32), default="ACTIVE")  # ACTIVE | OBSERVATION | SUSPENDED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=False, index=True)
    facility_id = Column(String(64), ForeignKey("facilities.id"), nullable=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), default="SOC_ANALYST")  # SUPER_ADMIN | ORG_ADMIN | FEDERATION_ADMIN | SOC_ANALYST | HOSPITAL_OPERATOR | AUDITOR | READ_ONLY
    clearance_level = Column(String(32), default="LEVEL_3_ANALYST")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class FederationModel(Base):
    __tablename__ = "federations"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    purpose = Column(String(256), default="Collaborative Pneumonia & Oncology Diagnostic AI")
    model_family_id = Column(String(64), default="MOD-MEDICAL-CNN-01")
    status = Column(String(32), default="ACTIVE")  # DRAFT | ACTIVE | PAUSED | ARCHIVED
    min_participant_quorum = Column(Integer, default=3)
    target_round_count = Column(Integer, default=50)
    current_round_id = Column(Integer, default=1)
    aggregation_strategy = Column(String(32), default="trust_weighted")
    quarantine_threshold = Column(Float, default=0.30)
    dp_enabled = Column(Boolean, default=False)
    dp_noise_multiplier = Column(Float, default=0.5)
    dp_clip_norm = Column(Float, default=10.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class FederationMembershipModel(Base):
    __tablename__ = "federation_memberships"

    id = Column(String(64), primary_key=True, index=True)
    federation_id = Column(String(64), ForeignKey("federations.id"), nullable=False, index=True)
    facility_id = Column(String(64), ForeignKey("facilities.id"), nullable=False, index=True)
    client_id = Column(String(16), nullable=False)
    status = Column(String(32), default="ACTIVE")  # ACTIVE | OBSERVATION | QUARANTINED | SUSPENDED
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ModelFamilyModel(Base):
    __tablename__ = "model_families"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    task_type = Column(String(64), default="PNEUMONIA_CLASSIFICATION")
    architecture_name = Column(String(64), default="MedicalImageCNN-3Stage")
    input_shape_json = Column(String(64), default="[1, 28, 28]")
    num_classes = Column(Integer, default=2)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ModelVersionModel(Base):
    __tablename__ = "model_versions"

    id = Column(String(64), primary_key=True, index=True)
    model_family_id = Column(String(64), ForeignKey("model_families.id"), nullable=False, index=True)
    federation_id = Column(String(64), ForeignKey("federations.id"), nullable=False, index=True)
    version_str = Column(String(32), nullable=False)  # e.g. "v1.0", "v1.1"
    round_id = Column(Integer, nullable=False)
    status = Column(String(32), default="ACTIVE")  # CANDIDATE | VALIDATED | ACTIVE | SUPERSEDED | QUARANTINED | ROLLED_BACK
    global_accuracy = Column(Float, default=0.0)
    global_loss = Column(Float, default=0.0)
    parent_version_id = Column(String(64), nullable=True)
    weights_path = Column(String(256), nullable=True)
    checksum_sha256 = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TrustHistoryModel(Base):
    __tablename__ = "trust_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String(16), nullable=False, index=True)
    facility_id = Column(String(64), nullable=True, index=True)
    round_id = Column(Integer, nullable=False, index=True)
    score = Column(Float, nullable=False)
    delta = Column(Float, default=0.0)
    state = Column(String(32), default="TRUSTED")
    penalty_breakdown_json = Column(Text, default="{}")
    reason = Column(Text, default="Zero-Trust validation pipeline pass")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class IncidentActionModel(Base):
    __tablename__ = "incident_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(32), ForeignKey("incidents.incident_id"), nullable=False, index=True)
    action_type = Column(String(64), nullable=False)  # CONFIRM_QUARANTINE | OVERRIDE_REINSTATE | REQUEST_EVIDENCE
    actor = Column(String(128), nullable=False)
    reason = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AppealModel(Base):
    __tablename__ = "appeals"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(32), ForeignKey("incidents.incident_id"), nullable=False, index=True)
    client_id = Column(String(16), nullable=False, index=True)
    facility_id = Column(String(64), nullable=True)
    appellant_name = Column(String(128), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(32), default="PENDING")  # PENDING | UNDER_REVIEW | APPROVED | REJECTED
    disposition_notes = Column(Text, default="")
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)


class UsageMetricModel(Base):
    __tablename__ = "usage_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=False, index=True)
    active_facilities_count = Column(Integer, default=1)
    rounds_executed_count = Column(Integer, default=0)
    updates_processed_count = Column(Integer, default=0)
    incidents_flagged_count = Column(Integer, default=0)
    month_year_str = Column(String(16), nullable=False)  # "2026-09"
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
