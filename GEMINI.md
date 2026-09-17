# GEMINI.md — FedSentinel-Health Root Engineering Rule File

## System Purpose & Core Architectural Invariants

FedSentinel-Health is an enterprise Zero-Trust security and integrity platform for collaborative federated AI across Indian hospital networks.

### Fundamental Data Boundary Invariant
```
PATIENT DATA (PHI / DICOM / Clinical Records)
  ↓ [NEVER LEAVES HOSPITAL LOCAL ENCLAVE]
Model Parameter Updates (ΔW)
  ↓ [Transmitted to Security Gateway]
FedSentinel 6-Layer Zero-Trust Gateway
  ↓ [Verification & Trust Assessment]
Robust Aggregator (Trust-Weighted / Multi-Krum / Trimmed-Mean)
  ↓ [Global Model Checkpoint]
Global Model Distributed to Participating Facilities
```

- **NEVER** refer to model parameter updates, gradients, update fingerprints, or trust scores as "patient data".
- **NEVER** transmit or log raw patient identifying information, clinical records, or DICOM images outside local enclave contexts.

---

## 1. Absolute Engineering Rules

### Rule 1 — Inspect Before Editing
Search the repository before creating new services, models, utilities, or components. Do not duplicate existing working implementations.

### Rule 2 — Preserve Working Systems
Do not rewrite or simplify existing working federated learning engine, non-IID partitioner, 6-layer security pipeline, aggregation algorithms, incident workflows, or dual-persona UI. Extend them cleanly.

### Rule 3 — Absolute Technical Honesty
Never present an unimplemented capability as operational. Every feature must be explicitly classified as:
- **`REAL IMPLEMENTATION`**: Verified working code with automated test/runtime evidence.
- **`SIMULATED DEMO DATA`**: Clearly marked synthetic/demonstration fleet data.
- **`ROADMAP / PENDING`**: Future planned architecture or research capability.

---

## 2. Regulatory & Architectural Positioning

- **Positioning alongside ABDM / HIE-CM**:
  - **ABDM / HIE-CM**: Consent & patient data interoperability plane.
  - **FedSentinel-Health**: Federated AI model integrity & security plane.
  - FedSentinel does NOT replace ABDM. Use precise wording: *"designed to align with"*, *"provides security controls supporting compliance with"*.
  - Do NOT make unsubstantiated claims such as *"ABDM mandated"*, *"HIPAA certified"*, or *"DPDP certified"*.

---

## 3. Backend Engineering Conventions

- **Framework**: FastAPI (Python 3.10+).
- **ML Framework**: PyTorch 2.x for model definitions, gradient deltas, tensor clipping, and vector distance calculations.
- **Data Models**: Pydantic v2 schemas for request/response serialization.
- **ORM & DB**: SQLAlchemy 2.0 ORM models. Schema migrations managed cleanly.
- **Error Handling**: Explicit HTTP exceptions (`HTTPException`), structured JSON error details, no silent exception swallowing.
- **Logging**: Python `logging` module with structured context (`event`, `client_id`, `round_id`). Never log raw weights or private keys.
- **Secrets Management**: Configuration loaded exclusively via Pydantic `BaseSettings` from environment variables (`.env`). No hardcoded secrets.

---

## 4. Frontend Engineering Conventions

- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS v4 using `@theme` block in `src/index.css`.
- **State Management**: Zustand store (`useFedSentinelStore.ts`) as single source of truth. Do NOT use React Context API.
- **Icons & Motion**: Lucide React (`lucide-react`) icons, Framer Motion (`motion`) for layout transitions.
- **Persona Architecture**:
  - **`SOC`**: Security Operations Center Analyst View (National Command Center, Pipeline Visualizer, Cluster Graph, Benchmark Lab).
  - **`HOSPITAL`**: Local Hospital Workstation View (Enclave status, Data shard stats, Plain-language security verdict, Appeal submission).
- **Definition of Done**: Every UI view must implement Loading, Empty, Populated, and Disconnected/Error states.

---

## 5. Security & Multi-Tenancy Rules

- **Authentication & RBAC**: JWT token authentication with server-side authorization enforcement. Never rely solely on hiding UI buttons.
- **Supported Roles**: `SUPER_ADMIN`, `ORG_ADMIN`, `FEDERATION_ADMIN`, `SOC_ANALYST`, `HOSPITAL_OPERATOR`, `AUDITOR`, `READ_ONLY`.
- **Tenant Scoping**: All database queries must be scoped to the authenticated user's `organization_id` / `facility_id` / `federation_id`.
- **Replay Protection**: Every model update payload must validate `federation_id`, `round_id`, `client_id`, `nonce`, and `timestamp_window`.
- **Input Sanitization**: CSV uploads for bulk facility onboarding must validate each row prior to import. Never silently drop corrupt rows.

---

## 6. Verification & Command Reference

### Test & Verification Commands
```bash
# Run PyTorch Coordinator Test Round
python -c "from backend.federation.coordinator import FederationCoordinator; c = FederationCoordinator(); import asyncio; r = asyncio.run(c.execute_round()); print('Round accuracy:', r.global_accuracy)"

# Run Backend FastAPI Server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Verify Frontend Build
cmd.exe /c "npm run build"

# Start Frontend Dev Server
cmd.exe /c "npm run dev -- --port 3002"
```

---

## 7. Prohibited Shortcuts

1. ❌ Never comment out failing assertions or swallow exceptions to force a demo to pass.
2. ❌ Never delete failing unit tests or mock away security layers.
3. ❌ Never use raw SQL string formatting — always use SQLAlchemy ORM or parameterized queries.
4. ❌ Never hardcode patient names or clinical identifiers in code or logs.
5. ❌ Never mutate global window objects or private DOM states.
6. ❌ Never declare a task complete without running build/verification commands.
