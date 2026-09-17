"""
Central State and Federation Orchestration Service for FedSentinel-Health
Unifies runtime PyTorch coordinator, in-memory telemetry, audit ledger, and database persistence.
Eliminates state divergence by serving as the authoritative single source of truth.
"""

from __future__ import annotations
import asyncio
import hashlib
import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple

import torch
import torch.nn.functional as F

from backend.core.config import settings
from backend.core.constants import AttackType, AggregationStrategy, ClientStatus, TrustState
from backend.ml.models.simple_cnn import MedicalImageCNN
from backend.schemas.clients import HospitalClient, CreateClientRequest, UpdateClientRequest
from backend.schemas.rounds import FederationRound
from backend.schemas.incidents import Incident, BlastRadius
from backend.schemas.trust import TrustScore
from backend.api.websocket import ws_hub
from backend.trust.policy import TrustPolicy, DEFAULT_TRUST_POLICY
from backend.db.database import init_db, SessionLocal
from backend.db.repository import (
    ClientRepository,
    RoundRepository,
    IncidentRepository,
    AuditRepository,
)

logger = logging.getLogger("fedsentinel.state")


class StateService:
    """Authoritative singleton managing coordinator, client nodes, rounds, and audit ledger."""

    def __init__(self):
        self.coordinator = None
        self._init_coordinator()

        # Database initialization & hydration (State survives restarts)
        self.clients_dict: Dict[str, HospitalClient] = {}
        self.rounds: List[FederationRound] = []
        self.incidents: List[Incident] = []
        self.trust_profiles: Dict[str, Dict[str, Any]] = {}
        self.audit_ledger: List[Dict[str, Any]] = []
        self.training_jobs: Dict[str, Dict[str, Any]] = {}

        try:
            init_db()
            self._hydrate_or_seed()
            logger.info(f"StateService hydrated from database ({len(self.clients_dict)} clients, {len(self.rounds)} rounds, {len(self.incidents)} incidents).")
        except Exception as e:
            logger.warning(f"Database initialization/hydration error ({e}); falling back to in-memory defaults.")
            self._fallback_seed()

        # Defense Configuration
        self.defense_config = {
            "enabled": True,
            "strategy": "trust_weighted",
            "auto_quarantine": True,
        }

        # Active simulation state counter
        self.simulation_counter = 35

    def _fallback_seed(self):
        self._init_clients()
        self.rounds = self._init_rounds()
        self.incidents = self._init_incidents()
        self.trust_profiles = self._init_trust_profiles()
        self.audit_ledger = self._init_audit_ledger()

    def _hydrate_or_seed(self):
        db = SessionLocal()
        try:
            # 1. Clients
            db_clients = ClientRepository.get_all(db)
            if db_clients:
                self.clients_dict = {c.client_id: c for c in db_clients}
            else:
                self._init_clients()
                for c in self.clients_dict.values():
                    ClientRepository.save(db, c)

            # Sync coordinator clients
            if self.coordinator and hasattr(self.coordinator, "clients"):
                for cid, client in self.clients_dict.items():
                    self.coordinator.clients[cid] = client

            # 2. Rounds
            db_rounds = RoundRepository.get_all(db)
            if db_rounds:
                self.rounds = db_rounds
            else:
                self.rounds = self._init_rounds()
                for r in self.rounds:
                    RoundRepository.save(db, r)

            # 3. Incidents
            db_incidents = IncidentRepository.get_all(db)
            if db_incidents:
                self.incidents = db_incidents
            else:
                self.incidents = self._init_incidents()
                for inc in self.incidents:
                    IncidentRepository.save(db, inc)

            # 4. Audit Ledger
            db_audit = AuditRepository.get_all(db)
            if db_audit:
                self.audit_ledger = db_audit
            else:
                self.audit_ledger = self._init_audit_ledger()
                for a in self.audit_ledger:
                    AuditRepository.save(db, a)

            # 5. Trust Profiles
            self.trust_profiles = self._init_trust_profiles()
        finally:
            db.close()

    def _init_coordinator(self):
        try:
            from backend.federation.coordinator import FederationCoordinator
            def _ws_event_handler(event_type: str, data: Dict[str, Any]):
                try:
                    asyncio.create_task(
                        ws_hub.broadcast(
                            event_type=event_type,
                            round_id=data.get("round_id", 0),
                            client_id=data.get("client_id", "SYSTEM"),
                            payload=data,
                        )
                    )
                except Exception:
                    pass

            self.coordinator = FederationCoordinator(event_emitter=_ws_event_handler)
            logger.info("FedSentinel PyTorch FederationCoordinator initialized.")
        except Exception as e:
            logger.warning(f"FederationCoordinator initialization error ({e}); using standalone state.")
            self.coordinator = None

    def _init_clients(self):
        initial = [
            HospitalClient(
                client_id="H1",
                name="Hospital 1 - Apollo / Mayo Clinic",
                status="TRUSTED",
                trust_score=98,
                samples_count=1420,
                historical_anomalies=0,
                last_active_round=24,
                enclave_type="Intel SGX Enclave",
                department="Pulmonology & Respiratory Medicine",
                disease_cohort="PNEUMONIA",
                contribution_weight=0.34,
                registered_at=datetime.now(timezone.utc).isoformat(),
                last_seen=datetime.now(timezone.utc).isoformat(),
            ),
            HospitalClient(
                client_id="H2",
                name="Hospital 2 - St. Mary / Johns Hopkins",
                status="TRUSTED",
                trust_score=94,
                samples_count=980,
                historical_anomalies=0,
                last_active_round=24,
                enclave_type="AMD SEV-SNP Confidential VM",
                department="Neurology & Brain Mapping",
                disease_cohort="GLIOBLASTOMA",
                contribution_weight=0.31,
                registered_at=datetime.now(timezone.utc).isoformat(),
                last_seen=datetime.now(timezone.utc).isoformat(),
            ),
            HospitalClient(
                client_id="H3",
                name="Hospital 3 - Metro General / St. Jude",
                status="QUARANTINED",
                trust_score=35,
                samples_count=520,
                historical_anomalies=2,
                last_active_round=24,
                enclave_type="AWS Nitro Enclaves",
                department="Pediatric Pulmonology & Rare Diseases",
                disease_cohort="PNEUMONIA",
                contribution_weight=0.0,
                registered_at=datetime.now(timezone.utc).isoformat(),
                last_seen=datetime.now(timezone.utc).isoformat(),
            ),
            HospitalClient(
                client_id="H4",
                name="Hospital 4 - Riverside / Cleveland Clinic",
                status="REVIEW",
                trust_score=68,
                samples_count=650,
                historical_anomalies=1,
                last_active_round=23,
                enclave_type="Intel SGX Enclave",
                department="Neuro-Oncology & Brain Tumor Center",
                disease_cohort="GLIOBLASTOMA",
                contribution_weight=0.15,
                registered_at=datetime.now(timezone.utc).isoformat(),
                last_seen=datetime.now(timezone.utc).isoformat(),
            ),
            HospitalClient(
                client_id="H5",
                name="Hospital 5 - University Medical / Charite",
                status="BLOCKED",
                trust_score=18,
                samples_count=320,
                historical_anomalies=4,
                last_active_round=21,
                enclave_type="Confidential Kubernetes Node",
                department="Infectious Disease & Pulmonary Medicine",
                disease_cohort="PNEUMONIA",
                contribution_weight=0.0,
                registered_at=datetime.now(timezone.utc).isoformat(),
                last_seen=datetime.now(timezone.utc).isoformat(),
            ),
            HospitalClient(
                client_id="H6",
                name="Hospital 6 - Toronto General Hospital",
                status="TRUSTED",
                trust_score=91,
                samples_count=810,
                historical_anomalies=0,
                last_active_round=24,
                enclave_type="Apple Secure Enclave Server",
                department="Neurosurgery & Pathology",
                disease_cohort="GLIOBLASTOMA",
                contribution_weight=0.20,
                registered_at=datetime.now(timezone.utc).isoformat(),
                last_seen=datetime.now(timezone.utc).isoformat(),
            ),
        ]
        for c in initial:
            self.clients_dict[c.client_id] = c
            if self.coordinator and hasattr(self.coordinator, "clients"):
                self.coordinator.clients[c.client_id] = c

    def _init_rounds(self) -> List[FederationRound]:
        return [
            FederationRound(
                round_id=24,
                status="COMPLETED",
                participating_clients=["H1", "H2", "H3", "H6"],
                quarantined_clients=["H3"],
                accepted_clients=["H1", "H2", "H6"],
                global_accuracy=94.5,
                global_loss=0.142,
                aggregation_strategy="trust_weighted",
                duration_ms=420.5,
                timestamp="2026-09-07T10:45:12Z",
            ),
            FederationRound(
                round_id=23,
                status="COMPLETED",
                participating_clients=["H1", "H2", "H4", "H6"],
                quarantined_clients=[],
                accepted_clients=["H1", "H2", "H4", "H6"],
                global_accuracy=93.8,
                global_loss=0.158,
                aggregation_strategy="trust_weighted",
                duration_ms=395.2,
                timestamp="2026-09-07T08:12:00Z",
            ),
            FederationRound(
                round_id=22,
                status="COMPLETED",
                participating_clients=["H1", "H2", "H3", "H4"],
                quarantined_clients=[],
                accepted_clients=["H1", "H2", "H3", "H4"],
                global_accuracy=93.1,
                global_loss=0.171,
                aggregation_strategy="trust_weighted",
                duration_ms=410.0,
                timestamp="2026-09-06T22:30:15Z",
            ),
            FederationRound(
                round_id=21,
                status="COMPLETED",
                participating_clients=["H1", "H2", "H5", "H6"],
                quarantined_clients=["H5"],
                accepted_clients=["H1", "H2", "H6"],
                global_accuracy=92.4,
                global_loss=0.189,
                aggregation_strategy="trust_weighted",
                duration_ms=442.8,
                timestamp="2026-09-06T18:05:40Z",
            ),
            FederationRound(
                round_id=20,
                status="COMPLETED",
                participating_clients=["H1", "H2", "H3", "H4", "H6"],
                quarantined_clients=[],
                accepted_clients=["H1", "H2", "H3", "H4", "H6"],
                global_accuracy=91.8,
                global_loss=0.205,
                aggregation_strategy="trust_weighted",
                duration_ms=455.1,
                timestamp="2026-09-06T14:00:00Z",
            ),
        ]

    def _init_incidents(self) -> List[Incident]:
        return [
            Incident(
                incident_id="FS-034",
                client_id="H3",
                round_id=24,
                update_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                integrity_status="PASS",
                threat_hypothesis="BACKDOOR",
                confidence="HIGH",
                action_taken="QUARANTINED",
                trust_before=85,
                trust_after=35,
                blast_radius=BlastRadius(
                    baseline_accuracy=0.94,
                    post_update_accuracy=0.91,
                    target_class_accuracy_drop=0.42,
                ),
                evidence_summary={
                    "layer0_local_validation": {"status": "PASS", "format_valid": True, "nan_inf_check": "CLEAN"},
                    "layer1_fingerprint": {"norm": 3.84, "cosine_distance_to_median": 0.68},
                    "layer2_anomaly": {"anomaly_score": 0.89, "threshold": 0.45},
                    "layer3_influence": {"influence_score": 0.94, "counterfactual_risk": 0.88},
                    "layer4_counterfactual": {"robustness_score": 0.21, "poison_probability": 0.92},
                    "layer5_attribution": {"attributed_client_id": "H3", "signature_match": True},
                    "trust_engine": {"trust_before": 85, "trust_after": 35},
                },
                timestamp="2026-09-07T10:45:15Z",
            ),
            Incident(
                incident_id="FS-029",
                client_id="H5",
                round_id=21,
                update_hash="9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                integrity_status="PASS",
                threat_hypothesis="MODEL_POISONING",
                confidence="HIGH",
                action_taken="BLOCKED",
                trust_before=52,
                trust_after=18,
                blast_radius=BlastRadius(
                    baseline_accuracy=0.93,
                    post_update_accuracy=0.74,
                    target_class_accuracy_drop=0.19,
                ),
                evidence_summary={
                    "layer0_local_validation": {"status": "PASS", "format_valid": True},
                    "layer1_fingerprint": {"norm": 8.92, "cosine_distance_to_median": 0.91},
                    "layer2_anomaly": {"anomaly_score": 0.96, "threshold": 0.45},
                    "trust_engine": {"trust_before": 52, "trust_after": 18},
                },
                timestamp="2026-09-06T18:05:42Z",
            ),
        ]

    def _init_trust_profiles(self) -> Dict[str, Dict[str, Any]]:
        return {
            "H3": {
                "client_id": "H3",
                "current_trust_score": 35,
                "status": "QUARANTINED",
                "incident_count": 1,
                "trust_history": [
                    {"round_id": 24, "score": 35, "delta": -50, "reason": "Backdoor watermark trigger detected (FS-034)", "timestamp": "2026-09-07T10:45:15Z"},
                    {"round_id": 22, "score": 85, "delta": 0, "reason": "Nominal participation", "timestamp": "2026-09-06T22:30:15Z"},
                    {"round_id": 20, "score": 85, "delta": 3, "reason": "High quality local dataset submission", "timestamp": "2026-09-06T14:00:00Z"},
                ],
                "penalties": [
                    {"type": "Adversarial Gradient Watermark", "points": -35, "date": "2026-09-07"},
                    {"type": "Byzantine Rejection Multi-Krum", "points": -15, "date": "2026-09-07"},
                ],
                "factors": {"anomaly_resistance": 0.18, "influence_safety": 0.12, "counterfactual_stability": 0.22, "consistency": 0.65},
            },
            "H1": {
                "client_id": "H1",
                "current_trust_score": 98,
                "status": "TRUSTED",
                "incident_count": 0,
                "trust_history": [
                    {"round_id": 24, "score": 98, "delta": 1, "reason": "Consistent clean gradient convergence", "timestamp": "2026-09-07T10:45:12Z"},
                    {"round_id": 23, "score": 97, "delta": 1, "reason": "Consensus alignment with centroid", "timestamp": "2026-09-07T08:12:00Z"},
                ],
                "factors": {"anomaly_resistance": 0.98, "influence_safety": 0.99, "counterfactual_stability": 0.97, "consistency": 0.98},
            },
        }

    def _init_audit_ledger(self) -> List[Dict[str, Any]]:
        # Hash chained immutable audit records
        initial_entries = [
            {
                "audit_id": "AUD-2026-8994",
                "incident_id": "FS-025",
                "action": "FLAGGED_REVIEW",
                "actor": "Influence Surface Analysis Engine (Layer 3)",
                "client_id": "H4",
                "reason": "Minor non-IID distributional drift flagged in neuro-oncology cohort",
                "timestamp": "2026-09-06T09:15:00Z",
                "prev_hash": "GENESIS_BLOCK_FED_SENTINEL_2026",
                "attestation": "DEMO_SIMULATED_ATTESTATION",
            },
            {
                "audit_id": "AUD-2026-9022",
                "incident_id": "FS-029",
                "action": "PERMANENT_BLOCK",
                "actor": "SecOps Chief Information Security Officer",
                "client_id": "H5",
                "reason": "Repeated gradient sign inversion attacks across 4 consecutive federation rounds",
                "timestamp": "2026-09-06T18:05:42Z",
                "prev_hash": "",
                "attestation": "DEMO_SIMULATED_ATTESTATION",
            },
            {
                "audit_id": "AUD-2026-9041",
                "incident_id": "FS-034",
                "action": "AUTOMATED_QUARANTINE",
                "actor": "Zero-Trust Security Pipeline (Layer 2 & Layer 4)",
                "client_id": "H3",
                "reason": "Spectral gradient anomaly (score 0.89 > 0.45) & Backdoor trigger footprint",
                "timestamp": "2026-09-07T10:45:15Z",
                "prev_hash": "",
                "attestation": "DEMO_SIMULATED_ATTESTATION",
            },
        ]

        # Chain SHA-256 digests
        prev_h = "0000000000000000000000000000000000000000000000000000000000000000"
        for item in initial_entries:
            item["prev_hash"] = prev_h
            raw = f"{prev_h}:{item['audit_id']}:{item['action']}:{item['client_id']}:{item['timestamp']}"
            item["audit_hash"] = hashlib.sha256(raw.encode()).hexdigest()
            prev_h = item["audit_hash"]

        return list(reversed(initial_entries))

    def _persist_client(self, client: HospitalClient):
        try:
            db = SessionLocal()
            try:
                ClientRepository.save(db, client)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Failed to persist client {client.client_id} to DB: {e}")

    def _persist_round(self, rnd: FederationRound):
        try:
            db = SessionLocal()
            try:
                RoundRepository.save(db, rnd)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Failed to persist round {rnd.round_id} to DB: {e}")

    def _persist_incident(self, inc: Incident):
        try:
            db = SessionLocal()
            try:
                IncidentRepository.save(db, inc)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Failed to persist incident {inc.incident_id} to DB: {e}")

    def _persist_audit_event(self, ev: Dict[str, Any]):
        try:
            db = SessionLocal()
            try:
                AuditRepository.save(db, ev)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Failed to persist audit event {ev.get('audit_id')} to DB: {e}")

    def add_round(self, rnd: FederationRound):
        """Adds a completed round to state and persists to database."""
        self.rounds.insert(0, rnd)
        self._persist_round(rnd)

    def add_incident(self, inc: Incident):
        """Adds a security incident to state and persists to database."""
        self.incidents.insert(0, inc)
        self._persist_incident(inc)

    def update_incident(self, inc: Incident):
        """Updates an existing incident in state and persists to database."""
        for i, existing in enumerate(self.incidents):
            if existing.incident_id == inc.incident_id:
                self.incidents[i] = inc
                break
        self._persist_incident(inc)

    def append_audit_event(self, action: str, actor: str, client_id: Optional[str], reason: str, incident_id: Optional[str] = None) -> Dict[str, Any]:
        prev_h = self.audit_ledger[0]["audit_hash"] if self.audit_ledger else "0" * 64
        audit_id = f"AUD-2026-{len(self.audit_ledger) + 9050:04d}"
        now_ts = datetime.now(timezone.utc).isoformat()
        raw = f"{prev_h}:{audit_id}:{action}:{client_id or 'SYSTEM'}:{now_ts}"
        audit_hash = hashlib.sha256(raw.encode()).hexdigest()

        record = {
            "audit_id": audit_id,
            "incident_id": incident_id or f"INC-{audit_id}",
            "action": action,
            "actor": actor,
            "client_id": client_id,
            "reason": reason,
            "timestamp": now_ts,
            "prev_hash": prev_h,
            "audit_hash": audit_hash,
            "attestation": "DEMO_SIMULATED_ATTESTATION",
        }
        self.audit_ledger.insert(0, record)
        self._persist_audit_event(record)
        return record

    def save_model_checkpoint(self, round_id: int, weights: torch.Tensor, accuracy: float) -> str:
        """Persists model weights checkpoint to disk and returns SHA-256 checksum."""
        os.makedirs(settings.MODEL_STORE_DIR, exist_ok=True)
        ckpt_path = os.path.join(settings.MODEL_STORE_DIR, f"global_model_round_{round_id}.pt")
        torch.save(weights, ckpt_path)
        sha = hashlib.sha256(weights.cpu().numpy().tobytes()).hexdigest()
        logger.info(f"Model checkpoint for round {round_id} saved to {ckpt_path} (SHA-256: {sha[:16]})")
        return sha

    # ── Client Accessors ──
    def get_all_clients(self) -> List[HospitalClient]:
        return list(self.clients_dict.values())

    def get_client(self, client_id: str) -> Optional[HospitalClient]:
        return self.clients_dict.get(client_id.strip().upper())

    def create_client(self, req: CreateClientRequest) -> HospitalClient:
        cid = req.client_id.strip().upper()
        if cid in self.clients_dict:
            raise ValueError(f"Client {cid} already exists")

        new_client = HospitalClient(
            client_id=cid,
            name=req.name.strip(),
            status=req.status or "TRUSTED",
            trust_score=req.trust_score if req.trust_score is not None else 95.0,
            samples_count=req.samples_count if req.samples_count is not None else 1000,
            historical_anomalies=0,
            last_active_round=self.rounds[0].round_id if self.rounds else 24,
            enclave_type=req.enclave_type or "Intel SGX Enclave",
            department=req.department or "General Clinical Research",
            disease_cohort=req.disease_cohort or "PNEUMONIA",
            registered_at=datetime.now(timezone.utc).isoformat(),
            last_seen=datetime.now(timezone.utc).isoformat(),
        )
        self.clients_dict[cid] = new_client
        if self.coordinator and hasattr(self.coordinator, "clients"):
            self.coordinator.clients[cid] = new_client

        # Initialize profile
        self.trust_profiles[cid] = {
            "client_id": cid,
            "current_trust_score": new_client.trust_score,
            "status": new_client.status,
            "incident_count": 0,
            "trust_history": [{
                "round_id": new_client.last_active_round,
                "score": new_client.trust_score,
                "delta": 0,
                "reason": f"Node registered ({new_client.enclave_type})",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }],
            "penalties": [],
            "factors": {"anomaly_resistance": 0.95, "influence_safety": 0.94, "counterfactual_stability": 0.96, "consistency": 0.98},
        }
        self._persist_client(new_client)
        return new_client

    def update_client(self, client_id: str, req: UpdateClientRequest) -> Optional[HospitalClient]:
        cid = client_id.strip().upper()
        client = self.clients_dict.get(cid)
        if not client:
            return None

        if req.name is not None:
            client.name = req.name.strip()
        if req.status is not None:
            client.status = req.status.strip().upper()
        if req.trust_score is not None:
            client.trust_score = max(0.0, min(100.0, float(req.trust_score)))
        if req.samples_count is not None:
            client.samples_count = max(50, req.samples_count)
        if req.enclave_type is not None:
            client.enclave_type = req.enclave_type.strip()
        if req.department is not None:
            client.department = req.department.strip()
        if req.disease_cohort is not None:
            client.disease_cohort = req.disease_cohort.strip().upper()

        client.last_seen = datetime.now(timezone.utc).isoformat()
        if self.coordinator and hasattr(self.coordinator, "clients") and cid in self.coordinator.clients:
            self.coordinator.clients[cid] = client

        self._persist_client(client)
        return client


# Global singleton instance
state_service = StateService()
