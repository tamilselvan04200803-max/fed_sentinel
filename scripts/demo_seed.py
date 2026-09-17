"""
Deterministic Seed Script for FedSentinel-Health
Seeds database with 5 hospital enclaves, 24 completed consensus rounds,
incident FS-034 with 6-layer forensic evidence, and SHA-256 hash-chained audit ledger.
"""

import os
import sys
import hashlib
from datetime import datetime, timezone, timedelta

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.db.database import init_db, SessionLocal
from backend.db.repository import (
    ClientRepository,
    RoundRepository,
    IncidentRepository,
    AuditRepository,
)
from backend.schemas.clients import HospitalClient
from backend.schemas.rounds import FederationRound
from backend.schemas.incidents import Incident, BlastRadius
from backend.db.models import ClientModel, RoundModel, IncidentModel, AuditEventModel


def seed_database():
    print(">> Initializing FedSentinel SQLite Schema...")
    init_db()
    session = SessionLocal()

    try:
        # 1. Clear existing seed data for idempotent runs
        session.query(AuditEventModel).delete()
        session.query(IncidentModel).delete()
        session.query(RoundModel).delete()
        session.query(ClientModel).delete()
        session.commit()
        print(">> Cleaned prior database records.")

        # 2. Seed 5 Hospital Enclaves
        clients = [
            HospitalClient(
                client_id="H1",
                name="Hospital 1 - AIIMS New Delhi",
                status="TRUSTED",
                trust_score=95.0,
                historical_anomalies=0,
                samples_count=1200,
                enclave_type="Intel SGX Enclave",
                department="Pulmonology & Critical Care",
                disease_cohort="PNEUMONIA",
                contribution_weight=0.25,
            ),
            HospitalClient(
                client_id="H2",
                name="Hospital 2 - Apollo Chennai",
                status="TRUSTED",
                trust_score=92.0,
                historical_anomalies=0,
                samples_count=950,
                enclave_type="AMD SEV-SNP Enclave",
                department="Radiology & Diagnostics",
                disease_cohort="PNEUMONIA",
                contribution_weight=0.25,
            ),
            HospitalClient(
                client_id="H3",
                name="Hospital 3 - Fortis Gurugram",
                status="TRUSTED",
                trust_score=88.0,
                historical_anomalies=1,
                samples_count=820,
                enclave_type="AWS Nitro Enclave",
                department="Neuro-Oncology",
                disease_cohort="GLIOBLASTOMA",
                contribution_weight=0.25,
            ),
            HospitalClient(
                client_id="H4",
                name="Hospital 4 - Manipal Bengaluru",
                status="TRUSTED",
                trust_score=94.0,
                historical_anomalies=0,
                samples_count=1100,
                enclave_type="Intel SGX Enclave",
                department="Pediatric Pulmonology",
                disease_cohort="PNEUMONIA",
                contribution_weight=0.25,
            ),
            HospitalClient(
                client_id="H5",
                name="Hospital 5 - Tata Memorial Mumbai",
                status="QUARANTINED",
                trust_score=32.0,
                historical_anomalies=3,
                samples_count=1450,
                enclave_type="Intel SGX Enclave",
                department="Clinical Neuro-Oncology",
                disease_cohort="GLIOBLASTOMA",
                contribution_weight=0.0,
            ),
        ]
        for c in clients:
            ClientRepository.save(session, c)
        print(f">> Seeded {len(clients)} confidential hospital enclaves.")

        # 3. Seed 24 Consensus Rounds
        base_time = datetime.now(timezone.utc) - timedelta(hours=48)
        for r_id in range(1, 25):
            progress = (r_id - 1) / 23.0
            acc = round(78.2 + (94.5 - 78.2) * (1 - (1 - progress) ** 2), 2)
            loss = round(0.55 - 0.43 * progress, 3)
            r_time = (base_time + timedelta(hours=r_id * 2)).isoformat()
            
            part = ["H1", "H2", "H3", "H4"] if r_id >= 20 else ["H1", "H2", "H3", "H4", "H5"]
            quar = ["H5"] if r_id >= 20 else []

            round_obj = FederationRound(
                round_id=r_id,
                status="COMPLETED",
                participating_clients=part,
                quarantined_clients=quar,
                accepted_clients=part,
                global_accuracy=acc,
                global_loss=loss,
                aggregation_strategy="trust_weighted",
                duration_ms=450.0 + r_id * 10,
                timestamp=r_time,
            )
            RoundRepository.save(session, round_obj)
        print(">> Seeded 24 completed federation rounds (v1 to v24).")

        # 4. Seed Incident FS-034
        incident = Incident(
            incident_id="FS-034",
            client_id="H5",
            round_id=24,
            threat_hypothesis="Backdoor Watermark Injection on Glioblastoma Class 7",
            confidence="98.4%",
            severity="CRITICAL",
            action_taken="HARDWARE_ENCLAVE_QUARANTINE",
            update_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            trust_before=78.0,
            trust_after=32.0,
            timestamp=datetime.now(timezone.utc).isoformat(),
            evidence_summary={
                "layer0_validation": {"passed": True, "norm": 4.12, "max_clip": 50.0},
                "layer1_fingerprint": {"signed": True, "norm": 4.12, "projection_dim": 16},
                "layer2_anomaly": {"passed": False, "anomaly_score": 0.88, "spatial_divergence": 4.82},
                "layer3_influence": {"passed": False, "influence_score": 0.88, "test_loss_delta": 0.142},
                "layer4_counterfactual": {"passed": False, "poison_probability": 0.96, "robustness_score": 0.15},
                "layer5_attribution": {"passed": True, "enclave_type": "Intel SGX", "dp_spent": 0.42},
            },
            blast_radius=BlastRadius(
                impacted_target_class="Class 7 (Malignant Glioblastoma)",
                scans_protected=1420,
                post_update_asr=88.4,
                target_class_accuracy_drop=42.0,
                liability_avoided_usd="$1.2M - $2.5M",
            ),
        )
        IncidentRepository.save(session, incident)
        print(">> Seeded Incident FS-034 with 6-layer forensic evidence.")

        # 5. Seed Cryptographic Hash-Chained Audit Ledger
        audit_events = [
            ("CONSENSUS_ROUND_STARTED", "Coordinator", None, 20, "Scheduled consensus round #20 initiated with 5 enclaves."),
            ("CLIENT_GRADIENT_RECEIVED", "H1", "H1", 20, "Gradient delta received, L0 norm checked (3.84)."),
            ("CLIENT_GRADIENT_RECEIVED", "H2", "H2", 20, "Gradient delta received, L0 norm checked (4.01)."),
            ("CLIENT_GRADIENT_RECEIVED", "H3", "H3", 20, "Gradient delta received, L0 norm checked (3.92)."),
            ("CLIENT_GRADIENT_RECEIVED", "H4", "H4", 20, "Gradient delta received, L0 norm checked (3.78)."),
            ("POISONING_ATTACK_INTERCEPTED", "SecurityGateway", "H5", 20, "L2 Spectral Anomaly detected directional divergence (+4.82σ)."),
            ("CLIENT_QUARANTINED", "SecurityGateway", "H5", 20, "Node H5 placed in automated hardware quarantine."),
            ("CONSENSUS_ROUND_COMPLETED", "Coordinator", None, 20, "Round #20 finalized with 4 clean nodes. Accuracy: 91.8%."),
            ("CONSENSUS_ROUND_COMPLETED", "Coordinator", None, 24, "Round #24 finalized with 4 clean nodes. Accuracy: 94.5%."),
            ("SEC_OPS_TRIAGE_ACTION", "CISO Directorate", "H5", 24, "Confirmed permanent quarantine for node H5 under Incident FS-034."),
        ]

        prev_hash = "0000000000000000000000000000000000000000000000000000000000000000"
        for idx, (action, actor, client_id, round_id, reason) in enumerate(audit_events):
            t_stamp = (base_time + timedelta(hours=idx * 4)).isoformat()
            audit_id = f"AUD-{1000 + idx}"
            raw = f"{prev_hash}:{audit_id}:{action}:{client_id or 'SYSTEM'}:{t_stamp}"
            audit_hash = hashlib.sha256(raw.encode()).hexdigest()

            AuditRepository.save(
                session,
                {
                    "audit_id": audit_id,
                    "action": action,
                    "actor": actor,
                    "client_id": client_id,
                    "round_id": round_id,
                    "severity": "CRITICAL" if "POISONING" in action or "QUARANTINED" in action else "INFO",
                    "reason": reason,
                    "timestamp": t_stamp,
                    "prev_hash": prev_hash,
                    "audit_hash": audit_hash,
                    "attestation": "TPM2_PCR0_QUOTE_VERIFIED",
                },
            )
            prev_hash = audit_hash

        print(f">> Seeded {len(audit_events)} cryptographically chained audit records.")

        print("\n============================================================")
        print("  FED SENTINEL-HEALTH DEMO SEEDING COMPLETED SUCCESSFULLY   ")
        print("============================================================")
        print(f"  Facilities: {len(clients)} nodes (H1-H4 Trusted, H5 Quarantined)")
        print(f"  Rounds:     24 completed rounds (Global Accuracy: 94.5%)")
        print(f"  Incidents:  FS-034 with 6-layer evidence & blast radius")
        print(f"  Ledger:     10 audit blocks with Merkle verification")
        print("============================================================\n")

    except Exception as e:
        session.rollback()
        print(f"ERROR: Seeding failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
