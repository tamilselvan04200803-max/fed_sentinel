"""
FedSentinel - SecOps Control Plane Backend
Evidence-driven security control plane for federated learning.
"Don't trust the update. Verify it."
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import hashlib
import json
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fedsentinel")

app = FastAPI(
    title="FedSentinel SecOps Engine",
    description="Evidence-driven security control plane for federated learning. Don't trust the update. Verify it.",
    version="2.4.0",
)

# Enable CORS for frontend clients (Vite dev server on localhost:3000, 3001, 3002, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Data Models Matching Frontend Types ---

class HospitalClient(BaseModel):
    client_id: str
    name: str
    status: str = "TRUSTED"  # TRUSTED | REVIEW | QUARANTINED | BLOCKED
    trust_score: int = 95
    samples_count: int = 1000
    historical_anomalies: int = 0
    last_active_round: int = 24
    enclave_type: Optional[str] = "Intel SGX Enclave"
    department: Optional[str] = "General Clinical Research"


class CreateClientRequest(BaseModel):
    client_id: str
    name: str
    status: Optional[str] = "TRUSTED"
    trust_score: Optional[int] = 95
    samples_count: Optional[int] = 1000
    enclave_type: Optional[str] = "Intel SGX Enclave"
    department: Optional[str] = "General Clinical Research"


class ClientActionRequest(BaseModel):
    action: str  # REINSTATE | QUARANTINE | BLOCK | ADJUST_TRUST
    trust_score: Optional[int] = None
    reason: Optional[str] = None


class FederationRound(BaseModel):
    round_id: int
    status: str  # COMPLETED | IN_PROGRESS | FAILED | PENDING
    participating_clients: List[str]
    quarantined_clients: List[str]
    accepted_clients: List[str]
    global_accuracy: float
    timestamp: str


class StartRoundRequest(BaseModel):
    round_id: Optional[int] = None
    target_clients: Optional[List[str]] = None


class BlastRadius(BaseModel):
    baseline_asr: float = 0.0
    post_update_asr: float = 86.0
    baseline_accuracy: float = 94.0
    post_update_accuracy: float = 91.0
    impacted_target_class: str = "Class 7 (Malignant Glioblastoma)"
    target_class_accuracy_drop: float = 42.0


class Incident(BaseModel):
    incident_id: str
    client_id: str
    round_id: int
    update_hash: str
    integrity_status: str = "PASS"
    threat_hypothesis: str = "BACKDOOR"
    confidence: str = "HIGH"
    action_taken: str = "QUARANTINED"
    trust_before: int
    trust_after: int
    blast_radius: Optional[BlastRadius] = None
    evidence_summary: Optional[Dict[str, Any]] = None
    timestamp: str


class AuthRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    role: Optional[str] = "SECOPS_ADMIN"
    hospital_affiliation: Optional[str] = "Federal Health Consortium"


# --- In-Memory SecOps Telemetry State ---

INITIAL_CLIENTS: List[HospitalClient] = [
    HospitalClient(
        client_id="H1",
        name="Hospital 1 - Mayo Clinic Rochester",
        status="TRUSTED",
        trust_score=98,
        samples_count=1420,
        historical_anomalies=0,
        last_active_round=24,
        enclave_type="Intel SGX Enclave",
        department="Oncology & Rare Diseases",
    ),
    HospitalClient(
        client_id="H2",
        name="Hospital 2 - Johns Hopkins Hospital",
        status="TRUSTED",
        trust_score=94,
        samples_count=980,
        historical_anomalies=0,
        last_active_round=24,
        enclave_type="AMD SEV-SNP Confidential VM",
        department="Neurology & Brain Mapping",
    ),
    HospitalClient(
        client_id="H3",
        name="Hospital 3 - St. Jude Regional",
        status="QUARANTINED",
        trust_score=35,
        samples_count=500,
        historical_anomalies=2,
        last_active_round=24,
        enclave_type="AWS Nitro Enclaves",
        department="Pediatric Genetics",
    ),
    HospitalClient(
        client_id="H4",
        name="Hospital 4 - Cleveland Clinic Foundation",
        status="REVIEW",
        trust_score=68,
        samples_count=650,
        historical_anomalies=1,
        last_active_round=23,
        enclave_type="Intel SGX Enclave",
        department="Cardiovascular Imaging",
    ),
    HospitalClient(
        client_id="H5",
        name="Hospital 5 - Charité Universitätsmedizin",
        status="BLOCKED",
        trust_score=18,
        samples_count=320,
        historical_anomalies=4,
        last_active_round=21,
        enclave_type="Confidential Kubernetes Node",
        department="Immunology",
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
        department="Pulmonology",
    ),
]

INITIAL_ROUNDS: List[FederationRound] = [
    FederationRound(
        round_id=24,
        status="COMPLETED",
        participating_clients=["H1", "H2", "H3", "H6"],
        quarantined_clients=["H3"],
        accepted_clients=["H1", "H2", "H6"],
        global_accuracy=94.5,
        timestamp="2026-09-07T10:45:12Z",
    ),
    FederationRound(
        round_id=23,
        status="COMPLETED",
        participating_clients=["H1", "H2", "H4", "H6"],
        quarantined_clients=[],
        accepted_clients=["H1", "H2", "H4", "H6"],
        global_accuracy=93.8,
        timestamp="2026-09-07T08:12:00Z",
    ),
    FederationRound(
        round_id=22,
        status="COMPLETED",
        participating_clients=["H1", "H2", "H3", "H4"],
        quarantined_clients=[],
        accepted_clients=["H1", "H2", "H3", "H4"],
        global_accuracy=93.1,
        timestamp="2026-09-06T22:30:15Z",
    ),
    FederationRound(
        round_id=21,
        status="COMPLETED",
        participating_clients=["H1", "H2", "H5", "H6"],
        quarantined_clients=["H5"],
        accepted_clients=["H1", "H2", "H6"],
        global_accuracy=92.4,
        timestamp="2026-09-06T18:05:40Z",
    ),
    FederationRound(
        round_id=20,
        status="COMPLETED",
        participating_clients=["H1", "H2", "H3", "H4", "H6"],
        quarantined_clients=[],
        accepted_clients=["H1", "H2", "H3", "H4", "H6"],
        global_accuracy=91.8,
        timestamp="2026-09-06T14:00:00Z",
    ),
]

INITIAL_INCIDENTS: List[Incident] = [
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
            baseline_asr=0,
            post_update_asr=86,
            baseline_accuracy=94,
            post_update_accuracy=91,
            impacted_target_class="Class 7 (Malignant Glioblastoma)",
            target_class_accuracy_drop=42,
        ),
        evidence_summary={
            "layer0_local_validation": {
                "status": "PASS",
                "checks_passed": 12,
                "total_checks": 12,
                "format_valid": True,
                "nan_inf_check": "CLEAN",
                "details": "Update passed tensor dimensions [128, 64, 3] and IEEE 754 float validity.",
            },
            "layer1_fingerprint": {
                "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "dimensions": 24576,
                "norm": 3.84,
                "cosine_distance_to_median": 0.68,
            },
            "layer2_anomaly": {
                "anomaly_score": 0.89,
                "threshold": 0.45,
                "flagged_dimensions": ["conv5_3.weight", "dense_out.bias"],
                "method": "Coordinate-wise Median Perturbation Analysis",
                "spatial_divergence": 4.82,
            },
            "layer3_influence": {
                "influence_score": 0.94,
                "counterfactual_risk": 0.88,
                "test_loss_delta": 0.042,
                "gradient_projection": 0.79,
            },
            "layer4_counterfactual": {
                "robustness_score": 0.21,
                "targeted_class_shift": "Class 7 (Malignant Glioblastoma)",
                "poison_probability": 0.92,
                "leave_one_out_impact": 0.18,
            },
            "layer5_attribution": {
                "attributed_client_id": "H3",
                "signature_match": True,
                "historical_pattern_similarity": 0.96,
                "device_pcr_match": True,
            },
            "trust_engine": {
                "trust_before": 85,
                "trust_after": 35,
                "penalty_breakdown": {
                    "ANOMALY_DIVERGENCE": -25,
                    "HIGH_INFLUENCE_RISK": -15,
                    "COUNTERFACTUAL_DROP": -10,
                },
                "recommended_action": "QUARANTINE_CLIENT",
                "decay_rate": 0.58,
            },
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
            baseline_asr=0,
            post_update_asr=42,
            baseline_accuracy=93,
            post_update_accuracy=74,
            impacted_target_class="All Classes",
            target_class_accuracy_drop=19,
        ),
        evidence_summary={
            "layer0_local_validation": {
                "status": "PASS",
                "checks_passed": 12,
                "total_checks": 12,
                "format_valid": True,
                "nan_inf_check": "CLEAN",
                "details": "Syntactic validation passed. Enclave signature present.",
            },
            "layer1_fingerprint": {
                "hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                "dimensions": 24576,
                "norm": 8.92,
                "cosine_distance_to_median": 0.91,
            },
            "layer2_anomaly": {
                "anomaly_score": 0.96,
                "threshold": 0.45,
                "flagged_dimensions": ["all_layers"],
                "method": "Spectral Gradient Decomposition",
                "spatial_divergence": 6.4,
            },
            "layer3_influence": {
                "influence_score": 0.98,
                "counterfactual_risk": 0.95,
                "test_loss_delta": 0.185,
            },
            "layer4_counterfactual": {
                "robustness_score": 0.12,
                "targeted_class_shift": "Global Accuracy Inversion",
                "poison_probability": 0.99,
            },
            "layer5_attribution": {
                "attributed_client_id": "H5",
                "signature_match": True,
                "historical_pattern_similarity": 0.88,
            },
            "trust_engine": {
                "trust_before": 52,
                "trust_after": 18,
                "penalty_breakdown": {
                    "EXTREME_GRADIENT_NORM": -20,
                    "GLOBAL_LOSS_INVERSION": -14,
                },
                "recommended_action": "PERMANENT_BLOCK",
            },
        },
        timestamp="2026-09-06T18:05:42Z",
    ),
    Incident(
        incident_id="FS-022",
        client_id="H4",
        round_id=19,
        update_hash="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        integrity_status="PASS",
        threat_hypothesis="FREE_RIDER",
        confidence="MEDIUM",
        action_taken="FLAGGED_REVIEW",
        trust_before=82,
        trust_after=68,
        blast_radius=BlastRadius(
            baseline_asr=0,
            post_update_asr=0,
            baseline_accuracy=91,
            post_update_accuracy=91,
            impacted_target_class="None",
            target_class_accuracy_drop=0,
        ),
        evidence_summary={
            "layer0_local_validation": {
                "status": "PASS",
                "checks_passed": 12,
                "total_checks": 12,
                "details": "Format clean but near-zero delta tensor detected.",
            },
            "layer1_fingerprint": {
                "hash": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
                "norm": 0.002,
                "cosine_distance_to_median": 0.01,
            },
            "layer2_anomaly": {
                "anomaly_score": 0.52,
                "threshold": 0.45,
                "method": "L2 Norm Zero-Drift Detector",
            },
            "trust_engine": {
                "trust_before": 82,
                "trust_after": 68,
                "penalty_breakdown": {
                    "FREE_RIDER_PENALTY": -14,
                },
                "recommended_action": "WARN_ADMINISTRATOR",
            },
        },
        timestamp="2026-09-05T12:18:00Z",
    ),
]

TRUST_PROFILES: Dict[str, Dict[str, Any]] = {
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
        "factors": {
            "anomaly_resistance": 0.18,
            "influence_safety": 0.12,
            "counterfactual_stability": 0.22,
            "consistency": 0.65,
        },
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
        "factors": {
            "anomaly_resistance": 0.98,
            "influence_safety": 0.99,
            "counterfactual_stability": 0.97,
            "consistency": 0.98,
        },
    },
}

# State stores
clients_db: List[HospitalClient] = [c.model_copy() for c in INITIAL_CLIENTS]
rounds_db: List[FederationRound] = [r.model_copy() for r in INITIAL_ROUNDS]
incidents_db: List[Incident] = [i.model_copy() for i in INITIAL_INCIDENTS]
simulation_counter = 35


# --- WebSocket Connection Hub ---

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, round_id: int, client_id: str, payload: Dict[str, Any]):
        message = {
            "event_type": event_type,
            "round_id": round_id,
            "client_id": client_id,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


ws_manager = WebSocketManager()


# --- API Routes ---

@app.get("/health")
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "FedSentinel Defense Control Plane",
        "version": "2.4.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/clients")
async def get_clients():
    return [c.model_dump() for c in clients_db]


@app.post("/api/clients")
async def create_client(req: CreateClientRequest):
    global clients_db, TRUST_PROFILES

    # Normalize client ID
    cid = req.client_id.strip().upper()
    if not cid:
        raise HTTPException(status_code=400, detail="Client ID cannot be blank")

    # Check if already exists
    existing = next((c for c in clients_db if c.client_id.upper() == cid), None)
    if existing:
        raise HTTPException(status_code=409, detail=f"Hospital node with ID '{cid}' is already registered.")

    new_client = HospitalClient(
        client_id=cid,
        name=req.name.strip(),
        status=req.status or "TRUSTED",
        trust_score=req.trust_score if req.trust_score is not None else 95,
        samples_count=req.samples_count if req.samples_count is not None else 1000,
        historical_anomalies=0,
        last_active_round=rounds_db[0].round_id if rounds_db else 24,
        enclave_type=req.enclave_type or "Intel SGX Enclave",
        department=req.department or "Clinical Department",
    )

    clients_db.append(new_client)

    # Initialize client trust profile
    TRUST_PROFILES[cid] = {
        "client_id": cid,
        "current_trust_score": new_client.trust_score,
        "status": new_client.status,
        "incident_count": 0,
        "trust_history": [
            {
                "round_id": new_client.last_active_round,
                "score": new_client.trust_score,
                "delta": 0,
                "reason": f"Node registered into federated enclave consortium ({new_client.enclave_type})",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "penalties": [],
        "factors": {
            "anomaly_resistance": 0.95,
            "influence_safety": 0.94,
            "counterfactual_stability": 0.96,
            "consistency": 0.98,
        },
    }

    # Broadcast event
    await ws_manager.broadcast(
        event_type="CLIENT_REGISTERED",
        round_id=new_client.last_active_round,
        client_id=cid,
        payload={
            "name": new_client.name,
            "trust_score": new_client.trust_score,
            "enclave_type": new_client.enclave_type,
            "department": new_client.department,
        },
    )

    return {"client": new_client.model_dump(), **new_client.model_dump()}


@app.post("/api/clients/{client_id}/action")
async def override_client_status(client_id: str, req: ClientActionRequest):
    global clients_db, TRUST_PROFILES

    cid = client_id.strip().upper()
    client = next((c for c in clients_db if c.client_id.upper() == cid), None)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client '{cid}' not found.")

    score_before = client.trust_score
    status_before = client.status

    if req.action == "REINSTATE":
        client.status = "TRUSTED"
        client.trust_score = req.trust_score if req.trust_score is not None else max(80, client.trust_score)
        reason = req.reason or "Administrator verified enclave integrity & reinstated node"
    elif req.action == "QUARANTINE":
        client.status = "QUARANTINED"
        client.trust_score = req.trust_score if req.trust_score is not None else 35
        client.historical_anomalies += 1
        reason = req.reason or "SecOps manual quarantine enforcement"
    elif req.action == "BLOCK":
        client.status = "BLOCKED"
        client.trust_score = req.trust_score if req.trust_score is not None else 10
        reason = req.reason or "Permanent block applied due to unverified gradient signature"
    elif req.action == "ADJUST_TRUST":
        if req.trust_score is not None:
            client.trust_score = max(0, min(100, req.trust_score))
        if client.trust_score >= 80:
            client.status = "TRUSTED"
        elif client.trust_score >= 50:
            client.status = "REVIEW"
        else:
            client.status = "QUARANTINED"
        reason = req.reason or f"Trust score adjusted to {client.trust_score}% by SecOps Lead"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")

    delta = client.trust_score - score_before

    # Update trust history
    if cid not in TRUST_PROFILES:
        TRUST_PROFILES[cid] = {
            "client_id": cid,
            "current_trust_score": client.trust_score,
            "status": client.status,
            "incident_count": 0,
            "trust_history": [],
            "penalties": [],
            "factors": {"anomaly_resistance": 0.9, "influence_safety": 0.9, "counterfactual_stability": 0.9, "consistency": 0.9},
        }

    TRUST_PROFILES[cid]["current_trust_score"] = client.trust_score
    TRUST_PROFILES[cid]["status"] = client.status
    TRUST_PROFILES[cid]["trust_history"].insert(0, {
        "round_id": rounds_db[0].round_id if rounds_db else 24,
        "score": client.trust_score,
        "delta": delta,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # Broadcast event
    await ws_manager.broadcast(
        event_type="CLIENT_STATUS_UPDATED",
        round_id=rounds_db[0].round_id if rounds_db else 24,
        client_id=cid,
        payload={
            "action": req.action,
            "status": client.status,
            "trust_score": client.trust_score,
            "reason": reason,
        },
    )

    return {"client": client.model_dump(), **client.model_dump()}


@app.get("/api/rounds")
async def get_rounds():
    return [r.model_dump() for r in rounds_db]


@app.post("/api/rounds/start")
async def start_round(request: StartRoundRequest):
    global rounds_db, clients_db

    latest_round_id = rounds_db[0].round_id if rounds_db else 24
    next_round_id = request.round_id or (latest_round_id + 1)

    all_client_ids = [c.client_id for c in clients_db if c.status != "BLOCKED"]
    participating = request.target_clients if request.target_clients else all_client_ids

    # Byzantine robust aggregation simulation:
    # Any client with status QUARANTINED or BLOCKED is segregated
    quarantined = [
        cid for cid in participating
        if any(c.client_id == cid and c.status in ("QUARANTINED", "BLOCKED") for c in clients_db)
    ]
    accepted = [cid for cid in participating if cid not in quarantined]

    # Calculate simulated global accuracy with zero-trust protection
    base_acc = rounds_db[0].global_accuracy if rounds_db else 94.0
    new_acc = round(min(98.5, base_acc + 0.3), 1)

    new_round = FederationRound(
        round_id=next_round_id,
        status="COMPLETED",
        participating_clients=participating,
        quarantined_clients=quarantined,
        accepted_clients=accepted,
        global_accuracy=new_acc,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    rounds_db.insert(0, new_round)

    # Update clients active round
    for c in clients_db:
        if c.client_id in participating:
            c.last_active_round = next_round_id

    # Broadcast WebSocket events
    await ws_manager.broadcast(
        event_type="ROUND_STARTED",
        round_id=next_round_id,
        client_id="SYSTEM",
        payload={"target_clients": participating},
    )

    if quarantined:
        await ws_manager.broadcast(
            event_type="BYZANTINE_DEFENSE_TRIGGERED",
            round_id=next_round_id,
            client_id="FEDERATION_GATEWAY",
            payload={
                "defense_algorithm": "Multi-Krum + Coordinate Median",
                "excluded_vectors": quarantined,
                "quorum_ratio": f"{len(accepted)}/{len(participating)} clients accepted",
            },
        )

    await ws_manager.broadcast(
        event_type="ROUND_COMPLETED",
        round_id=next_round_id,
        client_id="SYSTEM",
        payload={
            "global_accuracy": new_acc,
            "accepted_count": len(accepted),
            "quarantined_count": len(quarantined),
        },
    )

    return {"round": new_round.model_dump(), **new_round.model_dump()}


@app.get("/api/incidents")
async def get_incidents():
    return [i.model_dump() for i in incidents_db]


@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    for inc in incidents_db:
        if inc.incident_id.upper() == incident_id.upper():
            return {"incident": inc.model_dump(), **inc.model_dump()}
    raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")


@app.get("/api/trust/{client_id}")
async def get_client_trust(client_id: str):
    cid = client_id.upper()
    if cid in TRUST_PROFILES:
        return {"trust_info": TRUST_PROFILES[cid], **TRUST_PROFILES[cid]}

    # Fallback profile for clients without explicit history
    matching = next((c for c in clients_db if c.client_id.upper() == cid), None)
    score = matching.trust_score if matching else 85
    status = matching.status if matching else "TRUSTED"
    profile = {
        "client_id": cid,
        "current_trust_score": score,
        "status": status,
        "incident_count": 0,
        "trust_history": [
            {
                "round_id": 24,
                "score": score,
                "delta": 0,
                "reason": "Stable zero-trust verification pass",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
        "penalties": [],
        "factors": {
            "anomaly_resistance": 0.95,
            "influence_safety": 0.92,
            "counterfactual_stability": 0.94,
            "consistency": 0.96,
        },
    }
    return {"trust_info": profile, **profile}


@app.post("/api/simulation/start")
async def start_simulation():
    global simulation_counter, incidents_db, clients_db

    incident_id = f"FS-{simulation_counter:03d}"
    simulation_counter += 1

    latest_round = rounds_db[0].round_id if rounds_db else 24
    attack_hash = hashlib.sha256(f"backdoor_payload_{incident_id}_{latest_round}".encode()).hexdigest()

    simulated_incident = Incident(
        incident_id=incident_id,
        client_id="H3",
        round_id=latest_round,
        update_hash=attack_hash,
        integrity_status="PASS",
        threat_hypothesis="BACKDOOR",
        confidence="HIGH",
        action_taken="QUARANTINED",
        trust_before=85,
        trust_after=35,
        blast_radius=BlastRadius(
            baseline_asr=0.0,
            post_update_asr=89.4,
            baseline_accuracy=94.5,
            post_update_accuracy=91.2,
            impacted_target_class="Class 7 (Malignant Glioblastoma)",
            target_class_accuracy_drop=44.1,
        ),
        evidence_summary={
            "layer0_local_validation": {
                "status": "PASS",
                "checks_passed": 12,
                "total_checks": 12,
                "format_valid": True,
                "nan_inf_check": "CLEAN",
                "details": "Syntactic IEEE 754 float validation passed. Tensor signature verified.",
            },
            "layer1_fingerprint": {
                "hash": attack_hash,
                "dimensions": 24576,
                "norm": 4.12,
                "cosine_distance_to_median": 0.72,
                "fingerprint_sample": [0.12, -0.45, 0.88, -0.03, 0.65],
            },
            "layer2_anomaly": {
                "anomaly_score": 0.92,
                "threshold": 0.45,
                "flagged_dimensions": ["conv5_3.weight", "dense_classifier.bias"],
                "method": "Coordinate-wise Median Perturbation Analysis",
                "spatial_divergence": 4.82,
            },
            "layer3_influence": {
                "influence_score": 0.95,
                "counterfactual_risk": 0.89,
                "test_loss_delta": 0.048,
                "gradient_projection": 0.82,
            },
            "layer4_counterfactual": {
                "robustness_score": 0.19,
                "targeted_class_shift": "Class 7 (Malignant Glioblastoma)",
                "poison_probability": 0.94,
                "leave_one_out_impact": 0.22,
            },
            "layer5_attribution": {
                "attributed_client_id": "H3",
                "signature_match": True,
                "historical_pattern_similarity": 0.96,
                "device_pcr_match": True,
            },
            "trust_engine": {
                "trust_before": 85,
                "trust_after": 35,
                "penalty_breakdown": {
                    "ANOMALY_DIVERGENCE": -25,
                    "HIGH_INFLUENCE_RISK": -15,
                    "COUNTERFACTUAL_DROP": -10,
                },
                "recommended_action": "QUARANTINE_CLIENT",
                "decay_rate": 0.58,
            },
        },
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    incidents_db.insert(0, simulated_incident)

    # Quarantine H3
    for c in clients_db:
        if c.client_id == "H3":
            c.status = "QUARANTINED"
            c.trust_score = 35
            c.historical_anomalies += 1

    # Broadcast simulation telemetry via WebSocket
    await ws_manager.broadcast(
        event_type="SIMULATION_TRIGGERED",
        round_id=latest_round,
        client_id="H3",
        payload={
            "attack_type": "Targeted Backdoor Watermark",
            "target_class": "Class 7",
            "action_taken": "QUARANTINED",
            "incident_id": incident_id,
        },
    )

    await ws_manager.broadcast(
        event_type="CLIENT_QUARANTINED",
        round_id=latest_round,
        client_id="H3",
        payload={
            "reason": "Backdoor attack pattern detected in conv5_3 layer",
            "trust_dropped": "-50 points",
            "incident_id": incident_id,
        },
    )

    await ws_manager.broadcast(
        event_type="BYZANTINE_DEFENSE_TRIGGERED",
        round_id=latest_round,
        client_id="FEDERATION_GATEWAY",
        payload={
            "defense_algorithm": "Multi-Krum + Coordinate Median",
            "excluded_vectors": ["H3"],
            "quorum_ratio": "Accepted 3/4 clean gradients",
        },
    )

    await ws_manager.broadcast(
        event_type="INCIDENT_DETECTED",
        round_id=latest_round,
        client_id="H3",
        payload={"incident_id": incident_id, "threat_hypothesis": "BACKDOOR"},
    )

    return {
        "status": "SIMULATION_COMPLETE",
        "incident": simulated_incident.model_dump(),
    }


# --- Authentication Endpoint ---

@app.post("/api/auth/login")
async def login(req: AuthRequest):
    return {
        "user": {
            "id": "usr_" + hashlib.md5(req.email.encode()).hexdigest()[:8],
            "name": req.name or req.email.split("@")[0].replace(".", " ").title(),
            "email": req.email,
            "role": req.role or "SECOPS_ADMIN",
            "hospitalAffiliation": req.hospital_affiliation or "Federal Health Consortium",
            "clearanceLevel": "TOP_SECRET_FED_LEVEL_4",
        },
        "token": "jwt_fedsentinel_secops_" + hashlib.sha256(req.email.encode()).hexdigest()[:24],
    }


@app.post("/api/auth/register")
async def register(req: AuthRequest):
    return {
        "user": {
            "id": "usr_" + hashlib.md5(req.email.encode()).hexdigest()[:8],
            "name": req.name or req.email.split("@")[0].replace(".", " ").title(),
            "email": req.email,
            "role": req.role or "SECOPS_ADMIN",
            "hospitalAffiliation": req.hospital_affiliation or "Hospital Enclave Network",
            "clearanceLevel": "LEVEL_3_ANALYST",
        },
        "token": "jwt_fedsentinel_secops_" + hashlib.sha256(req.email.encode()).hexdigest()[:24],
    }


# --- WebSocket Endpoint ---

@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial handshake welcome
        welcome_event = {
            "event_type": "SYSTEM_CONNECTED",
            "round_id": rounds_db[0].round_id if rounds_db else 24,
            "client_id": "FEDERATION_GATEWAY",
            "payload": {"message": "FedSentinel SecOps WebSocket active", "active_clients": len(clients_db)},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await websocket.send_text(json.dumps(welcome_event))

        # Keep connection open and listen for client heartbeats or messages
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received WebSocket message: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
