# FedSentinel-Health Product Workflows

## Purpose & Scope

This specification establishes the end-to-end human workflows for FedSentinel-Health. The application operates not as a passive read-only dashboard, but as an **interactive, safety-critical federated learning control plane**.

Every workflow adheres strictly to the **10-Step Product Test Principle**:
$$\text{INTENT} \to \text{INPUT} \to \text{VALIDATION} \to \text{PREFLIGHT} \to \text{EXECUTION} \to \text{LIVE FEEDBACK} \to \text{RESULT} \to \text{EXPLANATION} \to \text{ACTION} \to \text{AUDIT}$$

---

## Workflow 1: Multi-Step Federated Round Creation & Launch

### Persona: Federation Operator / Platform Administrator

### Phase 1: Intent & Objective Specification
- **User Intent**: Initiate a new collaborative training round to improve global model accuracy on clinical diagnostic imaging.
- **Inputs**:
  - Model Target: Select from active model families (e.g., `MOD-MEDICAL-CNN-01` Pneumonia & Glioblastoma).
  - Target Round ID: System auto-suggests next sequential round (e.g., Round 25).

### Phase 2: Candidate Node Selection & Quorum Validation
- **User Action**: Select participating hospital consortium facilities from the registered fleet.
- **Client Status Indicators**:
  - Green (`READY`): Enclave attested, samples $> 500$, trust score $\ge 80$.
  - Amber (`REVIEW` / `OBSERVATION`): High latency or cold-start node.
  - Red / Disabled (`QUARANTINED` / `BLOCKED`): Excluded from selection with explicit badge explaining security status.
- **Live Quorum Enforcement**:
  - Dynamic display: `Current Selected: 4 | Minimum Quorum Required: 3 (PASS)`.
  - Launch button remains disabled if quorum is not satisfied.

### Phase 3: Federation Defense Policy Configuration
- **Aggregation Strategy**:
  - `Trust-Weighted (Recommended)`: Zero-Trust filtering with quadratic weight scaling based on verified gradient integrity.
  - `Multi-Krum`: Geometric median consensus (Byzantine-resilient up to $f < (n-2)/2$).
  - `Trimmed-Mean`: Coordinate-wise trimmed averaging with configurable trim ratio $\beta = 0.20$.
  - `FedAvg (Unprotected Baseline)`: Uniform weighting for research and control comparisons.
- **Quarantine Threshold**: Configurable slider ($30.0\%$ - $70.0\%$, default $50.0\%$).

### Phase 4: Privacy & Enclave Security Settings
- **Differential Privacy (DP)**:
  - Toggle DP Gaussian Noise mechanism.
  - Target $\epsilon$ budget (default $2.5$), Target $\delta$ (default $10^{-5}$).
  - Maximum gradient $L_2$ clipping norm (default $5.0$).
- **TEE Hardware Attestation**:
  - Require valid Intel SGX / AMD SEV-SNP attestation certificate before accepting gradients.

### Phase 5: Automated Preflight Verification (`POST /api/rounds/preflight`)
Before any computation starts, the system runs an automated preflight check that validates:
1. Quorum satisfied ($\ge 3$ active, unquarantined nodes).
2. Model checkpoint integrity (SHA-256 parameter checksum verified).
3. Client enclave availability and certificate validity.
4. Dataset partition compatibility and schema conformance.

**Preflight Verdict Banner**:
- `READY`: All checks green. Operator can proceed to launch.
- `WARNING`: Quorum met, but one node exhibits high latency or low sample count. Operator can review warnings and proceed with caution.
- `BLOCKED`: Quorum failed or global model corrupted. Launch disabled; explicit remediation action provided (e.g., "Reinstate quarantined node or lower quorum threshold").

### Phase 6: Pre-Execution Impact Review & Confirmation
- Modal displaying summary of parameters, participating hospitals, expected duration (~4.5s), and consequence declaration:
  *"Launching this round will distribute global weights v24 to 4 hospital enclaves, run local SGD, and aggregate via Trust-Weighted defense."*

### Phase 7: Live Execution & Real-Time Telemetry
- Operator clicks "Confirm & Launch Round".
- **Live Stage Progress Stepper**:
  1. `DISPATCHING_WEIGHTS`: Encrypted base weights sent to hospital enclaves.
  2. `LOCAL_ENCLAVE_TRAINING`: Nodes execute SGD; live update arrival indicator per hospital.
  3. `ZERO_TRUST_SECURITY_SCAN`: 6-layer pipeline executes (L0 -> L5).
  4. `ROBUST_AGGREGATION`: Byzantine-resilient consensus calculated.
  5. `GLOBAL_VALIDATION`: Model evaluated on holdout root-of-trust dataset.
- Real-time WebSocket events update radar charts and terminal logs.

### Phase 8: Round Summary & Decomposed Results
- Global Accuracy and Loss progression.
- Client participation breakdown: updates accepted vs quarantined.
- Aggregation weights assigned per node.

### Phase 9: Post-Round Actionable Next Steps
- Clickable actions:
  - `Inspect Cryptographic Audit Block`: View SHA-256 Merkle proof.
  - `View Model Version Checkpoint`: Inspect weights checksum and Model Card.
  - `Triage Incidents`: If anomalies detected, link directly to SOC Investigation.

---

## Workflow 2: Asynchronous Hospital Enclave Training Runner

### Persona: Hospital Clinical ML Engineer / Node Operator

### Phase 1: Node Health & Readiness Verification
- Select hospital facility (e.g., `H1 - AIIMS New Delhi` or `H3 - Tata Memorial`).
- System fetches `GET /api/clients/{client_id}/readiness`:
  - Enclave hardware status: Intel SGX TEE Active (PCR-0: `3f9a...c81e`).
  - Local dataset: 1,450 verified DICOM chest radiographs.
  - Class balance: Class 0 (62%), Class 1 (38%).

### Phase 2: Local Hyperparameter Configuration
- Training epochs ($1 - 10$, default $3$).
- Learning rate ($0.001 - 0.1$, default $0.01$).
- Batch size ($16 - 64$, default $32$).
- Differential Privacy local noise multiplier ($0.0 - 0.5$).
- Simulated Vector / Attack Mode (for testing enclave robustness):
  - `CLEAN`: Standard clinical SGD update.
  - `FREE_RIDER`: Near-zero gradient update ($\Delta W \times 10^{-3}$) to test free-rider elimination.
  - `MODEL_POISONING`: Sign-inverted adversarial gradient.
  - `BACKDOOR`: Pixel-pattern backdoor trigger.
  - `LABEL_FLIP`: Inverted diagnostic ground truth.

### Phase 3: Asynchronous Job Execution (`POST /api/training/jobs`)
- User clicks "Start Enclave Training Job".
- Backend returns `job_id: "JOB-H1-..."` with status `QUEUED`.
- **Live Progression Timeline**:
  - `QUEUED`: Enclave worker spawned.
  - `INITIALIZING`: Loading PyTorch MedicalImageCNN and local batch tensors.
  - `TRAINING`: Animated epoch progress bar with real-time loss curve ($ep_1 \to ep_2 \to ep_3$).
  - `VALIDATING`: Evaluating local test accuracy.
  - `SECURITY_SCAN`: Running Layer 0 IEEE-754 checks and Layer 1 SHA-256 fingerprinting.
  - `COMPLETED`: Gradient delta $\Delta W_i$ signed and prepared for gateway transmission.

### Phase 4: Enclave Telemetry & Inspection
- **Gradient Inspector**: Displays update norm $\|\Delta W_i\|_2$, SHA-256 hash, and top weight magnitude layers.
- **Decomposed Trust Score Preview**:
  - If `FREE_RIDER`: Alert shows *"Free-rider detected: Update norm ratio 0.001 < 0.05 cohort threshold. Security Cleanliness: 95.0% | Contribution Integrity: 2.0% | Status: SUSPICIOUS"*.
  - If `CLEAN`: *"Consensus alignment 98.4%. Trust Score: 95.0% | Status: TRUSTED"*.

### Phase 5: Cryptographic Audit Receipt
- Downloadable signed enclave attestation receipt with timestamp, PCR measurement, and model hash.

---

## Workflow 3: SOC Incident Triage & Forensic Quarantine

### Persona: Healthcare Security Operations Center (SOC) Analyst

### Phase 1: Alert Detection & Notification
- Real-time WebSocket alert triggers banner in Command Center:
  *"CRITICAL: Incident FS-034 flagged on Tata Memorial Hospital (H3). Model poisoning vector detected in Round 24."*

### Phase 2: Forensic Deep-Dive (`/incidents/{incident_id}`)
- **Incident Summary**: Incident ID, target facility, round ID, threat hypothesis (`MODEL_POISONING`), confidence score ($96\%$).
- **Spectral Anomaly Breakdown**:
  - Layer 2 Cosine divergence: $0.68$ (Threshold: $0.45$).
  - Update norm: $4.12$ (Cohort median: $1.15$).
- **Counterfactual Blast Radius Projection**:
  - Projected global accuracy if update had been accepted: $74.5\%$ (19.5% degradation).
  - Protected global accuracy with Zero-Trust Quarantine: $94.5\%$.
  - Target class error rate: $44.1\%$ vulnerability prevented.
- **Group Attribution & Shapley Score**:
  - Identifies H3 as the single source responsible for $92.4\%$ of directional variance.

### Phase 3: Actionable Remediation Modal
The analyst selects from three explicit, audited actions:
1. **Confirm Quarantine**: Keep node segregated, lock out from upcoming rounds, notify facility CISO.
2. **Reinstate Node**: If verified as false-positive due to rare pathology distribution. Requires inputting a mandatory clinical justification reason.
3. **Rollback Global Model**: If an update had accidentally been aggregated in an earlier unprotected round, triggers instantaneous rollback to last certified checkpoint.

### Phase 4: Action-Consequence Mapping
- Prior to confirmation, modal displays:
  *"Action: REINSTATE Tata Memorial (H3) | Consequence: Trust score will be restored to 80.0%, status set to REVIEW, node eligible for Round 25. An audit block will be immutably committed."*

### Phase 5: Immutable Audit Commit
- Submits cryptographic audit event (`CLIENT_REINSTATED` or `QUARANTINE_CONFIRMED`).
- Merkle leaf created; Merkle root updated in database.

---

## Workflow 4: Model Benchmark & Experimentation Workspace

### Persona: AI Research Engineer / Clinical Data Scientist

### Phase 1: Experiment Definition
- Select Base Model: `FedSentinel-MedicalCNN (37,858 params)`.
- Configure Comparison:
  - Defenses to evaluate: Trust-Weighted, Multi-Krum, Trimmed-Mean, Unprotected FedAvg.
  - Attack scenarios: Clean baseline, 20% Backdoor, 40% Model Poisoning, Free-Riders.
  - Client count: 5 nodes.
  - Reproducibility Seed: e.g., `42`.

### Phase 2: Benchmark Execution & Provenance Recording
- Backend executes comparative benchmark over identical gradient tensors.
- Results recorded into the **Experiment Provenance Registry**:
  - `experiment_id`: `EXP-2026-09-042`
  - `defense_strategy`: `trust_weighted`
  - `attack_type`: `BACKDOOR`
  - `accuracy`: `94.6%`
  - `attack_success_rate`: `1.2%`
  - `weights_checksum`: `sha256:...`
  - `status`: `COMPLETED`
- If an experiment combination has not been executed, UI displays `NOT MEASURED` rather than fabricated values.

### Phase 3: Clinical Model Card Export
- Generate structured JSON / Markdown Model Card adhering to IEEE / WHO standards for federated clinical AI governance.
