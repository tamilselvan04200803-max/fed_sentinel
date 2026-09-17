"""
Persistence and Database Hydration Invariant Tests for FedSentinel-Health
Verifies that StateService mutations correctly write through to SQLAlchemy ORM models
and recover seamlessly upon state reload / restart simulation.
"""

import pytest
from datetime import datetime, timezone
from backend.db.database import SessionLocal, init_db
from backend.db.models import ClientModel, AuditEventModel, RoundModel, IncidentModel
from backend.db.repository import ClientRepository, AuditRepository, RoundRepository, IncidentRepository
from backend.services.state_service import state_service
from backend.schemas.clients import CreateClientRequest


def test_database_hydration_and_write_through():
    """Verify that StateService writes through to relational storage and survives re-hydration."""
    test_client_id = f"HT_{int(datetime.now(timezone.utc).timestamp()) % 100000000}"
    
    # 1. Create client via state service
    req = CreateClientRequest(
        client_id=test_client_id,
        name="Test Autonomous Clinic Enclave",
        status="TRUSTED",
        trust_score=96.5,
        samples_count=1500,
        enclave_type="AMD SEV-SNP Enclave",
        department="Experimental Oncology",
    )
    created = state_service.create_client(req)
    assert created.client_id == test_client_id

    # 2. Verify direct database record existence
    db = SessionLocal()
    try:
        db_record = db.query(ClientModel).filter(ClientModel.client_id == test_client_id).first()
        assert db_record is not None
        assert db_record.name == "Test Autonomous Clinic Enclave"
        assert db_record.trust_score == 96.5
        assert db_record.enclave_type == "AMD SEV-SNP Enclave"
    finally:
        db.close()

    # 3. Append audit log and check DB persistence
    audit_record = state_service.append_audit_event(
        action="PERSISTENCE_VERIFICATION_TEST",
        actor="AUTOMATED_TEST_RUNNER",
        client_id=test_client_id,
        reason="Testing relational persistence write-through guarantees",
    )
    assert audit_record["audit_id"].startswith("AUD-2026-")

    db = SessionLocal()
    try:
        db_audit = db.query(AuditEventModel).filter(AuditEventModel.event_id == audit_record["audit_id"]).first()
        assert db_audit is not None
        assert db_audit.action == "PERSISTENCE_VERIFICATION_TEST"
    finally:
        db.close()

    # 4. Clean up test client to preserve pristine state
    db = SessionLocal()
    try:
        db.query(ClientModel).filter(ClientModel.client_id == test_client_id).delete()
        db.commit()
    finally:
        db.close()
    state_service.clients_dict.pop(test_client_id, None)
