"""
FedSentinel-Health Core Constants
Enumerations, status codes, and threshold constants.
"""

from __future__ import annotations
from enum import Enum


# ── Client Status ────────────────────────────────────────────────────
class ClientStatus(str, Enum):
    ACTIVE = "ACTIVE"
    TRAINING = "TRAINING"
    SUSPICIOUS = "SUSPICIOUS"
    QUARANTINED = "QUARANTINED"
    OFFLINE = "OFFLINE"


# ── Round Status ─────────────────────────────────────────────────────
class RoundStatus(str, Enum):
    PENDING = "PENDING"
    TRAINING = "TRAINING"
    VALIDATING = "VALIDATING"
    AGGREGATING = "AGGREGATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ── Severity ─────────────────────────────────────────────────────────
class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


# ── Detection Decision ──────────────────────────────────────────────
class DetectionDecision(str, Enum):
    ACCEPT = "ACCEPT"
    SUSPICIOUS = "SUSPICIOUS"
    QUARANTINE = "QUARANTINE"
    REJECT = "REJECT"


# ── Trust State ──────────────────────────────────────────────────────
class TrustState(str, Enum):
    TRUSTED = "TRUSTED"         # T > 0.70
    SUSPICIOUS = "SUSPICIOUS"   # 0.30 < T <= 0.70
    QUARANTINED = "QUARANTINED"  # T <= 0.30


# ── Aggregation Strategy ────────────────────────────────────────────
class AggregationStrategy(str, Enum):
    FEDAVG = "fedavg"
    TRUST_WEIGHTED = "trust_weighted"
    TRIMMED_MEAN = "trimmed_mean"


# ── Attack Type ──────────────────────────────────────────────────────
class AttackType(str, Enum):
    LABEL_POISONING = "label_poisoning"
    MODEL_POISONING = "model_poisoning"
    BACKDOOR_TRIGGER = "backdoor_trigger"
    ABNORMAL_MAGNITUDE = "abnormal_magnitude"
    COLLUDING_CLIENTS = "colluding_clients"


# ── Simulation Phase ────────────────────────────────────────────────
class SimulationPhase(str, Enum):
    IDLE = "IDLE"
    CLEAN = "CLEAN"
    ATTACK = "ATTACK"
    DEFENSE = "DEFENSE"
    RECOVERY = "RECOVERY"


# ── System Status ────────────────────────────────────────────────────
class SystemStatus(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    SIMULATING = "SIMULATING"
    ERROR = "ERROR"


# ── WebSocket Event Types ────────────────────────────────────────────
class WSEventType(str, Enum):
    ROUND_STARTED = "ROUND_STARTED"
    CLIENT_UPDATE_RECEIVED = "CLIENT_UPDATE_RECEIVED"
    VALIDATION_COMPLETED = "VALIDATION_COMPLETED"
    FINGERPRINT_COMPUTED = "FINGERPRINT_COMPUTED"
    ANOMALY_DETECTED = "ANOMALY_DETECTED"
    CLIENT_QUARANTINED = "CLIENT_QUARANTINED"
    AGGREGATION_COMPLETED = "AGGREGATION_COMPLETED"
    MODEL_EVALUATED = "MODEL_EVALUATED"
    INCIDENT_CREATED = "INCIDENT_CREATED"
    TRUST_SCORE_CHANGED = "TRUST_SCORE_CHANGED"
    ATTACK_STARTED = "ATTACK_STARTED"
    ATTACK_STOPPED = "ATTACK_STOPPED"
    DEFENSE_TOGGLED = "DEFENSE_TOGGLED"
    CLIENT_REGISTERED = "CLIENT_REGISTERED"


# ── Audit Actions ────────────────────────────────────────────────────
class AuditAction(str, Enum):
    UPDATE_RECEIVED = "UPDATE_RECEIVED"
    UPDATE_REJECTED = "UPDATE_REJECTED"
    CLIENT_QUARANTINED = "CLIENT_QUARANTINED"
    CLIENT_REINSTATED = "CLIENT_REINSTATED"
    TRUST_CHANGED = "TRUST_CHANGED"
    MODEL_AGGREGATED = "MODEL_AGGREGATED"
    ATTACK_STARTED = "ATTACK_STARTED"
    ATTACK_STOPPED = "ATTACK_STOPPED"
    INCIDENT_CREATED = "INCIDENT_CREATED"
    DEFENSE_TOGGLED = "DEFENSE_TOGGLED"
    CLIENT_REGISTERED = "CLIENT_REGISTERED"
    SIMULATION_STARTED = "SIMULATION_STARTED"
    SIMULATION_STOPPED = "SIMULATION_STOPPED"
    USER_LOGIN = "USER_LOGIN"
    USER_REGISTER = "USER_REGISTER"


# ── Incident Decision ───────────────────────────────────────────────
class IncidentDecision(str, Enum):
    QUARANTINED = "QUARANTINED"
    FLAGGED = "FLAGGED"
    CLEARED = "CLEARED"


# ── Evidence Layer ───────────────────────────────────────────────────
class EvidenceLayer(str, Enum):
    L0 = "L0"
    L1 = "L1"
    L2 = "L2"
    INFLUENCE = "INFLUENCE"
    ATTRIBUTION = "ATTRIBUTION"
    ROBUSTNESS = "ROBUSTNESS"


# ── Evidence Status ──────────────────────────────────────────────────
class EvidenceStatus(str, Enum):
    PASS = "PASS"
    WARN = "WARN"
    FAIL = "FAIL"


# ── Default Hospital Nodes ──────────────────────────────────────────
DEFAULT_HOSPITALS = [
    {
        "client_id": "H1",
        "name": "Apollo General Hospital",
        "enclave_type": "Intel SGX Enclave",
        "department": "Pulmonology & Radiology",
        "sample_count": 1200,
    },
    {
        "client_id": "H2",
        "name": "St. Mary Regional Medical Center",
        "enclave_type": "AMD SEV-SNP",
        "department": "Oncology & Pathology",
        "sample_count": 980,
    },
    {
        "client_id": "H3",
        "name": "Metro General Hospital",
        "enclave_type": "AWS Nitro Enclaves",
        "department": "Emergency Radiology",
        "sample_count": 1450,
    },
    {
        "client_id": "H4",
        "name": "Riverside Community Health",
        "enclave_type": "Intel SGX Enclave",
        "department": "Diagnostic Imaging",
        "sample_count": 870,
    },
    {
        "client_id": "H5",
        "name": "University Medical Institute",
        "enclave_type": "Apple Secure Enclave",
        "department": "Clinical Research & AI",
        "sample_count": 1100,
    },
]
