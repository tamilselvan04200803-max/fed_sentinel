"""
Database Repository Layer for FedSentinel-Health
Enterprise CRUD operations, persistence mapping, and database hydration.
Bridges in-memory StateService and relational database (SQLite/PostgreSQL).
"""

from __future__ import annotations
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session
from backend.db.database import Base, engine, SessionLocal
from backend.db.models import (
    ClientModel,
    RoundModel,
    IncidentModel,
    AuditEventModel,
    TrustHistoryModel,
    ModelVersionModel,
    OrganizationModel,
    FacilityModel,
    UserModel,
    FederationModel,
)
from backend.schemas.clients import HospitalClient
from backend.schemas.rounds import FederationRound
from backend.schemas.incidents import Incident, BlastRadius

logger = logging.getLogger("fedsentinel.repository")


def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


class ClientRepository:
    """Persistence repository for hospital enclave nodes."""

    @staticmethod
    def get_all(db: Session) -> List[HospitalClient]:
        records = db.query(ClientModel).all()
        clients = []
        for r in records:
            clients.append(
                HospitalClient(
                    client_id=r.client_id,
                    name=r.name,
                    status=r.status,
                    trust_score=r.trust_score,
                    anomaly_score=r.anomaly_score,
                    samples_count=r.samples_count,
                    historical_anomalies=r.historical_anomalies,
                    last_active_round=r.last_active_round,
                    enclave_type=r.enclave_type,
                    department=r.department,
                    disease_cohort=getattr(r, "disease_cohort", "PNEUMONIA"),
                    contribution_weight=r.contribution_weight,
                    registered_at=r.registered_at.isoformat() if r.registered_at else datetime.now(timezone.utc).isoformat(),
                    last_seen=r.last_seen.isoformat() if r.last_seen else datetime.now(timezone.utc).isoformat(),
                )
            )
        return clients

    @staticmethod
    def save(db: Session, client: HospitalClient):
        existing = db.query(ClientModel).filter(ClientModel.client_id == client.client_id).first()
        if existing:
            existing.name = client.name
            existing.status = client.status
            existing.trust_score = client.trust_score
            existing.samples_count = client.samples_count
            existing.historical_anomalies = client.historical_anomalies
            existing.last_active_round = client.last_active_round
            existing.enclave_type = client.enclave_type
            existing.department = client.department
            existing.contribution_weight = client.contribution_weight
            existing.last_seen = datetime.now(timezone.utc)
        else:
            new_record = ClientModel(
                client_id=client.client_id,
                name=client.name,
                status=client.status,
                trust_score=client.trust_score,
                anomaly_score=getattr(client, "anomaly_score", 0.05),
                samples_count=client.samples_count,
                historical_anomalies=client.historical_anomalies,
                last_active_round=client.last_active_round,
                enclave_type=client.enclave_type,
                department=client.department,
                contribution_weight=client.contribution_weight,
                registered_at=datetime.now(timezone.utc),
                last_seen=datetime.now(timezone.utc),
            )
            db.add(new_record)
        db.commit()


class RoundRepository:
    """Persistence repository for federation consensus rounds."""

    @staticmethod
    def get_all(db: Session, limit: int = 100) -> List[FederationRound]:
        records = db.query(RoundModel).order_by(RoundModel.round_id.desc()).limit(limit).all()
        rounds = []
        for r in records:
            try:
                part = json.loads(r.participating_clients_json or "[]")
                quar = json.loads(r.quarantined_clients_json or "[]")
                acc = json.loads(r.accepted_clients_json or "[]")
            except Exception:
                part, quar, acc = [], [], []

            rounds.append(
                FederationRound(
                    round_id=r.round_id,
                    status=r.status,
                    participating_clients=part,
                    quarantined_clients=quar,
                    accepted_clients=acc,
                    global_accuracy=r.global_accuracy,
                    timestamp=r.timestamp.isoformat() if r.timestamp else datetime.now(timezone.utc).isoformat(),
                )
            )
        return rounds

    @staticmethod
    def save(db: Session, rnd: FederationRound):
        existing = db.query(RoundModel).filter(RoundModel.round_id == rnd.round_id).first()
        part_json = json.dumps(rnd.participating_clients)
        quar_json = json.dumps(rnd.quarantined_clients)
        acc_json = json.dumps(rnd.accepted_clients)

        if existing:
            existing.status = rnd.status
            existing.participating_clients_json = part_json
            existing.quarantined_clients_json = quar_json
            existing.accepted_clients_json = acc_json
            existing.global_accuracy = rnd.global_accuracy
        else:
            new_record = RoundModel(
                round_id=rnd.round_id,
                status=rnd.status,
                participating_clients_json=part_json,
                quarantined_clients_json=quar_json,
                accepted_clients_json=acc_json,
                global_accuracy=rnd.global_accuracy,
                timestamp=datetime.now(timezone.utc),
            )
            db.add(new_record)
        db.commit()


class IncidentRepository:
    """Persistence repository for security and poisoning incidents."""

    @staticmethod
    def get_all(db: Session, limit: int = 100) -> List[Incident]:
        records = db.query(IncidentModel).order_by(IncidentModel.timestamp.desc()).limit(limit).all()
        incidents = []
        for r in records:
            try:
                evidence_summary = json.loads(r.evidence_summary_json or "{}")
            except Exception:
                evidence_summary = {}

            try:
                blast_radius = json.loads(r.blast_radius_json or "{}")
            except Exception:
                blast_radius = {}

            incidents.append(
                Incident(
                    incident_id=r.incident_id,
                    client_id=r.client_id,
                    round_id=r.round_id,
                    update_hash=getattr(r, "update_hash", f"hash_{r.incident_id}"),
                    integrity_status="FAIL" if r.decision == "QUARANTINED" else "PASS",
                    threat_hypothesis=r.threat_hypothesis,
                    confidence=r.severity or "HIGH",
                    action_taken=r.decision,
                    trust_before=r.trust_score + 35.0 if r.trust_score else 85.0,
                    trust_after=r.trust_score or 45.0,
                    blast_radius=BlastRadius(**blast_radius) if blast_radius else None,
                    evidence_summary=evidence_summary if evidence_summary else None,
                    timestamp=r.timestamp.isoformat() if r.timestamp else datetime.now(timezone.utc).isoformat(),
                )
            )
        return incidents

    @staticmethod
    def save(db: Session, incident: Incident):
        blast_json = json.dumps(
            incident.blast_radius
            if isinstance(incident.blast_radius, dict)
            else (incident.blast_radius.model_dump() if incident.blast_radius else {})
        )
        ev_summary_json = json.dumps(
            incident.evidence_summary
            if isinstance(incident.evidence_summary, dict)
            else (incident.evidence_summary.model_dump() if incident.evidence_summary else {})
        )

        existing = db.query(IncidentModel).filter(IncidentModel.incident_id == incident.incident_id).first()
        if existing:
            existing.decision = incident.action_taken
            existing.threat_hypothesis = incident.threat_hypothesis
            existing.severity = incident.confidence
            existing.trust_score = incident.trust_after
            existing.blast_radius_json = blast_json
            existing.evidence_summary_json = ev_summary_json
        else:
            new_record = IncidentModel(
                incident_id=incident.incident_id,
                client_id=incident.client_id,
                round_id=incident.round_id,
                severity=incident.confidence,
                threat_hypothesis=incident.threat_hypothesis,
                decision=incident.action_taken,
                trust_score=incident.trust_after,
                blast_radius_json=blast_json,
                evidence_summary_json=ev_summary_json,
                status="OPEN" if incident.action_taken == "QUARANTINED" else "RESOLVED",
                timestamp=datetime.now(timezone.utc),
            )
            db.add(new_record)
        db.commit()


class AuditRepository:
    """Persistence repository for cryptographic hash-chained audit events."""

    @staticmethod
    def get_all(db: Session, limit: int = 500) -> List[Dict[str, Any]]:
        records = db.query(AuditEventModel).order_by(AuditEventModel.id.desc()).limit(limit).all()
        events = []
        for r in records:
            try:
                meta = json.loads(r.metadata_json or "{}")
            except Exception:
                meta = {}
            events.append({
                "audit_id": r.event_id,
                "incident_id": meta.get("incident_id", f"INC-{r.event_id}"),
                "action": r.action,
                "actor": r.actor,
                "client_id": r.client_id,
                "round_id": r.round_id,
                "severity": r.severity,
                "reason": meta.get("reason", ""),
                "timestamp": meta.get("timestamp") or (r.timestamp.isoformat() if r.timestamp else datetime.now(timezone.utc).isoformat()),
                "prev_hash": meta.get("prev_hash", "0" * 64),
                "audit_hash": meta.get("audit_hash", ""),
                "attestation": meta.get("attestation", "DEMO_SIMULATED_ATTESTATION"),
            })
        return events

    @staticmethod
    def save(db: Session, event: Dict[str, Any]):
        new_record = AuditEventModel(
            event_id=event.get("audit_id") or f"AUD-{datetime.now(timezone.utc).timestamp()}",
            actor=event.get("actor", "SYSTEM_SECOPS"),
            action=event.get("action", "UNKNOWN"),
            client_id=event.get("client_id"),
            round_id=event.get("round_id"),
            severity=event.get("severity", "INFO"),
            metadata_json=json.dumps({
                "incident_id": event.get("incident_id"),
                "reason": event.get("reason", ""),
                "timestamp": event.get("timestamp"),
                "prev_hash": event.get("prev_hash", ""),
                "audit_hash": event.get("audit_hash", ""),
                "attestation": event.get("attestation", ""),
            }),
            timestamp=datetime.now(timezone.utc),
        )
        db.add(new_record)
        db.commit()
