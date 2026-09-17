"""
End-to-End API Route Test Suite for FedSentinel-Health
Tests health, clients, training, inference, strategy comparison, and audit verification.
"""

import pytest
import uuid
from fastapi.testclient import TestClient
import main


@pytest.fixture
def client():
    return TestClient(main.app)


def test_health_endpoint(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["service"] == "FedSentinel-Health"
    assert "environment" in data


def test_clients_crud(client):
    r = client.get("/api/clients")
    assert r.status_code == 200
    clients = r.json()
    assert len(clients) >= 5

    # Test client update
    r_up = client.put("/api/clients/H1", json={"department": "Advanced Diagnostic Imaging"})
    assert r_up.status_code == 200
    assert r_up.json()["department"] == "Advanced Diagnostic Imaging"


def test_model_predict(client):
    r = client.post("/api/model/predict", json={"sample_id": "sample_eval_01"})
    assert r.status_code == 200
    data = r.json()
    assert "prediction" in data
    assert "confidence" in data
    assert "layer_activations" in data


def test_strategy_comparison(client):
    r = client.post("/api/rounds/compare-strategies")
    assert r.status_code == 200
    data = r.json()
    assert "trust_weighted" in data
    assert "multi_krum" in data
    assert "trimmed_mean" in data
    assert "fedavg" in data


def test_audit_cryptographic_verification(client):
    r = client.get("/api/audit/verify")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "VERIFIED_INTEGRITY"
    assert data["chain_valid"] is True
    assert data["verified_count"] >= 3


def test_pagination_endpoints(client):
    """Verify pagination contracts on clients, rounds, and audit logs."""
    # Clients pagination
    r_clients = client.get("/api/clients?page=1&size=2")
    assert r_clients.status_code == 200
    p_clients = r_clients.json()
    assert "items" in p_clients
    assert "total" in p_clients
    assert len(p_clients["items"]) == 2
    assert p_clients["page"] == 1
    assert p_clients["page_size"] == 2
    assert p_clients["pages"] >= 3

    # Rounds pagination
    r_rounds = client.get("/api/rounds?page=1&size=1")
    assert r_rounds.status_code == 200
    p_rounds = r_rounds.json()
    assert "items" in p_rounds
    assert len(p_rounds["items"]) == 1

    # Audit logs pagination
    r_audit = client.get("/api/audit/logs?page=1&size=3")
    assert r_audit.status_code == 200
    p_audit = r_audit.json()
    assert "items" in p_audit
    assert len(p_audit["items"]) <= 3


def test_enterprise_endpoints(client):
    """Test round detail, security config, dashboard summary, model versions, register, and ws-ticket."""
    # 1. Round detail
    r_rd = client.get("/api/rounds/24")
    assert r_rd.status_code == 200
    assert r_rd.json()["round_id"] == 24

    # 2. Security config
    r_sec = client.get("/api/security/config")
    assert r_sec.status_code == 200
    sec_data = r_sec.json()
    assert "layers" in sec_data
    assert "quarantine_threshold" in sec_data
    assert sec_data["defense_enabled"] is True

    # 3. Dashboard summary
    r_dash = client.get("/api/dashboard/summary")
    assert r_dash.status_code == 200
    dash_data = r_dash.json()
    assert "active_hospitals" in dash_data
    assert "threat_level" in dash_data
    assert "defense_mode" in dash_data

    # 4. Model versions
    r_mv = client.get("/api/model/versions")
    assert r_mv.status_code == 200
    mv_data = r_mv.json()
    assert "versions" in mv_data
    assert len(mv_data["versions"]) >= 1

    # 5. User registration
    unique_user = f"analyst_{uuid.uuid4().hex[:8]}@hospital.gov.in"
    r_reg = client.post(
        "/api/auth/register",
        json={
            "email": unique_user,
            "password": "SecurePassword123!",
            "name": "Dr. Ramesh Patel",
            "role": "SOC_ANALYST",
        },
    )
    assert r_reg.status_code == 200
    reg_data = r_reg.json()
    assert "token" in reg_data
    auth_token = reg_data["token"]

    # 6. WebSocket ticket generation
    r_ticket = client.post(
        "/api/auth/ws-ticket",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert r_ticket.status_code == 200
    ticket_data = r_ticket.json()
    assert "ticket" in ticket_data
    assert ticket_data["expires_in"] == 60


def test_round_preflight_check(client):
    """Test round preflight gate validates quorum, model integrity, and quarantine boundaries."""
    # Test nominal preflight with active nodes
    r = client.post(
        "/api/rounds/preflight",
        json={"target_clients": ["H1", "H2", "H4"], "min_quorum": 3, "strategy": "trust_weighted"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] in ("READY", "WARNING")
    assert data["quorum"]["met"] is True
    assert "H1" in data["eligible_clients"]
    assert len(data["checks"]) >= 3

    # Test preflight failure when quorum cannot be met
    r_fail = client.post(
        "/api/rounds/preflight",
        json={"target_clients": ["H3", "H5"], "min_quorum": 3},  # Both are quarantined/blocked!
    )
    assert r_fail.status_code == 200
    data_fail = r_fail.json()
    assert data_fail["status"] == "BLOCKED"
    assert data_fail["quorum"]["met"] is False
    assert len(data_fail["blockers"]) >= 1


def test_client_readiness_endpoint(client):
    """Test deep node readiness endpoint returning TEE attestation, dataset distribution, and network SLA."""
    r = client.get("/api/clients/H1/readiness")
    assert r.status_code == 200
    data = r.json()
    assert data["client_id"] == "H1"
    assert "hardware_tee" in data
    assert data["hardware_tee"]["attestation_status"] == "VALID"
    assert "dataset_health" in data
    assert "enclave_software_stack" in data
    assert "network_telemetry" in data


def test_async_training_jobs(client):
    """Test asynchronous enclave training job runner and stage lifecycle."""
    r = client.post(
        "/api/training/jobs",
        json={"client_id": "H1", "epochs": 2, "attack_mode": "CLEAN"},
    )
    assert r.status_code == 200
    job_resp = r.json()
    assert "job_id" in job_resp
    job_id = job_resp["job_id"]
    assert job_resp["status"] == "COMPLETED"

    # Query job status
    r_get = client.get(f"/api/training/jobs/{job_id}")
    assert r_get.status_code == 200
    job_data = r_get.json()
    assert job_data["job_id"] == job_id
    assert len(job_data["stages"]) >= 5
    assert len(job_data["loss_curve"]) == 2

    # Query job list
    r_list = client.get("/api/training/jobs")
    assert r_list.status_code == 200
    assert len(r_list.json()) >= 1


def test_model_benchmark_experiments(client):
    """Test model experiment provenance registry and benchmark execution."""
    # List experiments
    r_list = client.get("/api/models/experiments")
    assert r_list.status_code == 200
    experiments = r_list.json()
    assert len(experiments) >= 4
    first_exp = experiments[0]
    assert "experiment_id" in first_exp
    assert "defense_strategy" in first_exp
    assert "global_accuracy" in first_exp
    assert first_exp["provenance_verified"] is True

    # Run benchmark experiment
    r_run = client.post(
        "/api/models/experiments/run",
        json={"defense_strategy": "trust_weighted", "attack_type": "BACKDOOR", "seed": 42},
    )
    assert r_run.status_code == 200
    run_data = r_run.json()
    assert "experiment_id" in run_data
    assert run_data["global_accuracy"] >= 90.0
    assert run_data["provenance_verified"] is True


def test_free_rider_enclave_training(client):
    """Test that free-rider update (norm_ratio < 0.05) is detected, penalized, and quarantined."""
    r = client.post(
        "/api/hospitals/H1/train",
        json={"attack_mode": "FREE_RIDER", "epochs": 2},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["is_free_rider"] is True
    assert data["norm_ratio"] < 0.05
    assert data["trust_after"] <= 50
    assert "decomposed_trust" in data
    assert data["decomposed_trust"]["contribution_integrity"] <= 15.0
    assert data["decomposed_trust"]["security_cleanliness"] >= 85.0
    assert data["quarantined"] is True
    assert "FREE_RIDER" in data["plain_verdict"]

