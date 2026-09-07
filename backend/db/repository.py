"""
Database Repository Layer for FedSentinel-Health
CRUD operations, in-memory caching, and initialization seeds.
"""

from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.db.database import Base, engine, SessionLocal
from backend.db.models import ClientModel, RoundModel, IncidentModel, AuditEventModel
from backend.core.constants import DEFAULT_HOSPITALS, ClientStatus
from backend.schemas.clients import HospitalClient
from backend.schemas.rounds import FederationRound
from backend.schemas.incidents import Incident, AuditEvent


def init_db():
    """Create all tables and seed initial hospital nodes if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(ClientModel).count() == 0:
            for item in DEFAULT_HOSPITALS:
                client = ClientModel(
                    client_id=item["client_id"],
                    name=item["name"],
                    status="ACTIVE",
                    trust_score=95.0 if item["client_id"] != "H3" else 92.0,
                    anomaly_score=0.04 if item["client_id"] != "H3" else 0.08,
                    samples_count=item["sample_count"],
                    enclave_type=item["enclave_type"],
                    department=item["department"],
                    contribution_weight=0.20,
                    registered_at=datetime.now(timezone.utc),
                    last_seen=datetime.now(timezone.utc),
                )
                db.add(client)
            db.commit()
    finally:
        db.close()
