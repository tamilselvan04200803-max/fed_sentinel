# FedSentinel-Health Frontend ↔ Backend Contract

> **Audit Date**: 2026-09-16  
> **Source**: OpenAPI (35 paths), Backend routes (7 modules), Frontend components (43 files)

---

## Contract Structure

For each feature area:
- **UI**: Frontend route / component
- **Endpoint**: Backend API path and method
- **Request**: Body/params
- **Response**: Key response fields
- **Authorization**: Required role(s)
- **Failure Modes**: Expected error states
- **Realtime Events**: WebSocket events that affect this data
- **Source of Truth**: Backend or frontend

---

## 1. Command Center (Dashboard)

| UI | Endpoint | Method | Auth | Response |
|----|----------|--------|------|----------|
| System Status | `GET /health` | GET | None | `status`, `environment`, `uptime` |
| Active Clients | `GET /api/clients` | GET | Required | `HospitalClient[]` |
| Latest Round | `GET /api/rounds` | GET | Required | `FederationRound[]` (latest first) |
| Open Incidents | `GET /api/incidents` | GET | Required | `Incident[]` |
| Model Status | `GET /api/model/status` | GET | None | `model_version`, `global_accuracy`, `checksum` |
| Metrics | `GET /api/metrics` | GET | None | Prometheus text or JSON |

**Realtime**: `ROUND_COMPLETED`, `CLIENT_QUARANTINED`, `INCIDENT_CREATED`, `ANOMALY_DETECTED`  
**Source of Truth**: Backend `StateService`  
**Gap**: No single "dashboard summary" endpoint. Frontend must compose 4-5 separate calls.  
**Recommendation**: Consider `GET /api/dashboard/summary` to reduce chattiness.

---

## 2. Federation (Rounds)

| UI | Endpoint | Method | Auth | Request | Response |
|----|----------|--------|------|---------|----------|
| Round List | `GET /api/rounds` | GET | Required | — | `FederationRound[]` |
| Start Round | `POST /api/rounds/start` | POST | FEDERATION_ADMIN | `{round_id?, target_clients?}` | `FederationRound` + results |
| Attack Sim | `POST /api/simulation/attack` | POST | SOC_ANALYST | `{target_client_id, attack_type, intensity, defense_enabled}` | `Incident` |
| Defense Toggle | `POST /api/defense/toggle` | POST | FEDERATION_ADMIN | `{enabled}` | `{defense_enabled, mode}` |
| Strategy Compare | `GET /api/rounds/{round_id}/compare-strategies` | GET | Required | — | `{strategy: accuracy}` |

**Realtime**: `ROUND_STARTED`, `CLIENT_UPDATE_RECEIVED`, `AGGREGATION_COMPLETED`, `ROUND_COMPLETED`  
**Source of Truth**: Backend `FederationCoordinator.execute_round()`  
**Gap**: No pagination on rounds list. No round detail endpoint (`GET /api/rounds/{round_id}`).

---

## 3. Trust Center

| UI | Endpoint | Method | Auth | Response |
|----|----------|--------|------|----------|
| Trust Profile | `GET /api/trust/{client_id}` | GET | Required | `ClientTrustInfo` with history, factors, penalties |
| Client List (with scores) | `GET /api/clients` | GET | Required | `HospitalClient[]` (includes `trust_score`) |

**Realtime**: `CLIENT_QUARANTINED`, `ROUND_COMPLETED` (trust scores change per round)  
**Source of Truth**: Backend `TrustEngine.compute_trust()`  
**Gap**: No bulk trust endpoint. Must call `/api/trust/{id}` per client for detail. No trust policy version endpoint.

---

## 4. Security Operations

| UI | Endpoint | Method | Auth | Response |
|----|----------|--------|------|----------|
| Defense Status | `POST /api/defense/toggle` | POST | FEDERATION_ADMIN | `{defense_enabled, mode}` |
| Pipeline Config | — | — | — | **MISSING**: No endpoint to inspect or configure security pipeline thresholds |

**Gap**: No `GET /api/security/config` to inspect current pipeline settings. Frontend hardcodes pipeline visualization. No `GET /api/security/pipeline/{round_id}` for per-round pipeline results.

---

## 5. Incidents

| UI | Endpoint | Method | Auth | Request | Response |
|----|----------|--------|------|---------|----------|
| Incident List | `GET /api/incidents` | GET | Required | — | `Incident[]` |
| Incident Detail | `GET /api/incidents/{incident_id}` | GET | Required | — | `Incident` with evidence_summary |
| Triage Action | `POST /api/incidents/{incident_id}/action` | POST | SOC_ANALYST | `{action, reason, actor}` | Updated incident |

**Realtime**: `INCIDENT_CREATED`, `SECURITY_DETECTION`  
**Source of Truth**: Backend `IncidentManager.create_incident()`  
**Gap**: No pagination. No severity filter. No status filter. No SLA tracking fields.

---

## 6. Model Center

| UI | Endpoint | Method | Auth | Request | Response |
|----|----------|--------|------|---------|----------|
| Model Status | `GET /api/model/status` | GET | None | — | `model_version`, `architecture`, `checksum`, `global_accuracy` |
| Model Card | `GET /api/model/card` | GET | None | — | Structured model documentation |
| Rollback | `POST /api/model/rollback` | POST | Required | `{target_round_id, reason}` | Rollback confirmation + audit |
| Inference | `POST /api/predict` | POST | None | `{sample_id, model_type?}` | `{predicted_class, confidence, probabilities}` |

**Realtime**: `MODEL_PROMOTED`, `MODEL_ROLLED_BACK`  
**Source of Truth**: Backend `FederationCoordinator.global_weights`  
**Gap**: No version history endpoint (`GET /api/model/versions`). No model lineage endpoint. Rollback is audit-only — does not actually restore weights in current implementation.

---

## 7. Hospital Workstation

| UI | Endpoint | Method | Auth | Request | Response |
|----|----------|--------|------|---------|----------|
| Hospital Profile | `GET /api/clients/{client_id}` | GET | Required | — | `HospitalClient` |
| Local Training | `POST /api/hospitals/{client_id}/train` | POST | Required | `{disease_type, samples_count, epochs, learning_rate, batch_size, noise_level, attack_mode}` | Training result with pipeline verdict, trust impact |
| Inference | `POST /api/predict` | POST | None | `{sample_id}` | Prediction result |
| Client Action | `POST /api/clients/{client_id}/action` | POST | Required | `{action, trust_score?, reason?}` | Updated client |

**Realtime**: `CLIENT_UPDATE_RECEIVED`, `SECURITY_DETECTION`, `CLIENT_QUARANTINED`  
**Source of Truth**: Backend `training_routes.train_hospital_enclave()`  
**Gap**: No appeal submission endpoint. No training history endpoint per hospital.

---

## 8. Audit & Evidence

| UI | Endpoint | Method | Auth | Response |
|----|----------|--------|------|----------|
| Audit Logs | `GET /api/audit/logs` | GET | AUDITOR | `{logs: AuditEvent[], count: number}` |
| Chain Verify | `GET /api/audit/verify` | GET | AUDITOR | `{status, verified_count, chain_valid, root_hash}` |

**Source of Truth**: Backend `StateService.audit_ledger`  
**Gap**: No pagination. No search/filter. No export endpoint. No actor filter. No date range filter. Returns entire ledger in one response.

---

## 9. Authentication

| UI | Endpoint | Method | Auth | Request | Response |
|----|----------|--------|------|---------|----------|
| Login | `POST /api/auth/login` | POST | None | `{email, password, role?, name?}` | `{access_token, user}` |
| Current User | `GET /api/auth/me` | GET | Required | — | `UserContext` |

---

## 10. System Health

| UI | Endpoint | Method | Auth | Response |
|----|----------|--------|------|----------|
| Health Check | `GET /health` | GET | None | `{status, version, environment, uptime}` |
| Readiness | `GET /ready` | GET | None | `{ready, checks{}}` |
| Metrics | `GET /metrics` | GET | None | Prometheus text |
| Demo Reset | `POST /api/demo/reset` | POST | None | Reset confirmation |

---

## 11. Interactive Human Control Plane Endpoints (Added in Human Transformation)

| UI | Endpoint | Method | Auth | Request | Response |
|----|----------|--------|------|---------|----------|
| Round Preflight Gate | `POST /api/rounds/preflight` | POST | Required | `{model_version, target_clients, min_quorum, strategy, dp_enabled}` | `{status, checks[], quorum, eligible_clients[], excluded_clients[], estimated_duration_seconds}` |
| Asynchronous Job Submit | `POST /api/training/jobs` | POST | Required | `{client_id, epochs, batch_size, lr, attack_mode, noise_level}` | `{job_id, status: "QUEUED", client_id, created_at}` |
| Asynchronous Job Status | `GET /api/training/jobs/{job_id}` | GET | Required | — | `{job_id, status, epoch, total_epochs, loss_curve[], metrics, six_layer_verdict, merkle_root}` |
| Training Job History | `GET /api/training/jobs` | GET | Required | Optional `client_id` | `TrainingJob[]` |
| Node Readiness Health | `GET /api/clients/{client_id}/readiness` | GET | Required | — | `{status, hardware_tee, dataset_health, stack_health, network, recommendations[]}` |
| Benchmark Experiments | `GET /api/models/experiments` | GET | Required | Optional `model_family` | `ExperimentProvenanceRecord[]` |
| Run Benchmark Experiment | `POST /api/models/experiments/run` | POST | Required | `{model_family, defense_strategy, attack_type, seed, client_count}` | `ExperimentProvenanceRecord` |

---

## Implemented & Verified Backend Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /api/rounds/{round_id}` | Individual round detail with client breakdown | ✅ IMPLEMENTED |
| `GET /api/model/versions` | Model version history with SHA-256 parameter digests | ✅ IMPLEMENTED |
| `GET /api/security/config` | Active pipeline thresholds and defense policies | ✅ IMPLEMENTED |
| `GET /api/dashboard/summary` | Unified command center metrics | ✅ IMPLEMENTED |
| `POST /api/auth/ws-ticket` | Single-use 60s ticket for secure WebSocket auth | ✅ IMPLEMENTED |
| `GET /api/audit/blocks` | Merkle tree audit blocks and cryptographic verification | ✅ IMPLEMENTED |
| `GET /api/clients` | Filterable, paginated client registry | ✅ IMPLEMENTED |
| `GET /api/incidents` | Filterable, paginated incidents | ✅ IMPLEMENTED |
| `POST /api/rounds/preflight` | Preflight validation gate for round creation | ✅ IMPLEMENTED |
| `POST /api/training/jobs` | Asynchronous hospital enclave training job runner | ✅ IMPLEMENTED |
| `GET /api/clients/{client_id}/readiness` | Deep node readiness & TEE attestation audit | ✅ IMPLEMENTED |
| `GET /api/models/experiments` | Verifiable model experiment provenance registry | ✅ IMPLEMENTED |

---

## Non-Fabrication Invariants Enforced

1. **Zero-Fabricated Trust Trajectories**: Chart historical points only render for rounds where the node was an active participant. Missing rounds display gaps with `"Node idle / did not participate"`.
2. **Benchmark Provenance Guarantee**: If an attack/defense permutation has not been experimentally validated, the interface explicitly displays `NOT MEASURED`.
3. **Free-Rider Defense**: Ineffective/zero updates are flagged as `FREE_RIDER` with severe contribution penalties and zero aggregation weight, rather than receiving high trust due to low spatial anomaly scores.
