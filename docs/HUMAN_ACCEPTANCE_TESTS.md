# Human Acceptance Test Scenarios (HAT)

## Overview & Methodology

Human Acceptance Tests (HAT) ensure FedSentinel-Health operates as a practical, dependable, and intuitive product for real human operators. Each scenario exercises the **10-Step Product Test Paradigm**:
$$\text{INTENT} \to \text{INPUT} \to \text{VALIDATION} \to \text{PREFLIGHT} \to \text{EXECUTION} \to \text{LIVE FEEDBACK} \to \text{RESULT} \to \text{EXPLANATION} \to \text{ACTION} \to \text{AUDIT}$$

---

## Persona 1: Federation Operator (National Health Authority)

### Test Scenario HAT-FED-01: Collaborative Round Launch with Preflight Quarantine Gate
- **Intent**: Launch Round 25 to incorporate fresh chest imaging data from across Indian hospital networks.
- **Actions**:
  1. Navigate to `/federation` -> Click `Create New Round`.
  2. Select Model `MOD-MEDICAL-CNN-01` (Version: `global-model-v24`).
  3. Select participating hospitals: `H1 (AIIMS)`, `H2 (Apollo)`, `H3 (Tata Memorial)`, `H4 (Fortis)`, `H5 (NIMHANS)`.
  4. Notice `H3 (Tata Memorial)` is flagged with a red badge: `"QUARANTINED (Incident FS-034)"`.
  5. Select Aggregation Strategy: `Trust-Weighted (Recommended)`.
  6. Review Preflight Gate:
     - Check 1 (Quorum): `PASS (4 of 5 active, minimum 3 required)`.
     - Check 2 (Model): `PASS (Checksum verified)`.
     - Check 3 (Excluded): `H3 excluded automatically due to active quarantine`.
     - Overall Preflight Status: `READY`.
  7. Click `Confirm & Launch Round`.
- **Live Feedback**:
  - Live stage stepper advances: `DISPATCHING` -> `LOCAL_TRAINING` -> `SECURITY_SCAN` -> `AGGREGATION` -> `VALIDATION`.
- **Results & Audit**:
  - New global accuracy: `94.8% (+0.3%)`.
  - Quarantined: `["H3"]`.
  - Accepted: `["H1", "H2", "H4", "H5"]`.
  - SHA-256 Merkle Block committed to audit log.
  - User can click `"Inspect Merkle Audit Block"` or `"View Model Card"`.

---

## Persona 2: Hospital ML Engineer (Clinical Radiologist / Enclave Operator)

### Test Scenario HAT-ENG-02: Enclave Training Job & Free-Rider Detection
- **Intent**: Run a local enclave training job on node `H1` and verify the free-rider defense.
- **Actions**:
  1. Navigate to `/hospital` -> Select node `H1 - AIIMS New Delhi`.
  2. Inspect Node Readiness Card: Verify TEE Intel SGX active, 1,450 samples, class balance nominal.
  3. Set Hyperparameters: Epochs = 3, Batch Size = 32, Learning Rate = 0.01.
  4. Test 1 (Clean Update):
     - Select Attack Mode: `CLEAN`.
     - Click `Start Enclave Training Job`.
     - Live progress shows 3 epochs completing, loss dropping from $0.48 \to 0.22 \to 0.14$.
     - Security verdict: `PASS across all 6 Zero-Trust Layers`.
     - Trust score: `95.0% (TRUSTED)`. Aggregation weight: `0.264`.
  5. Test 2 (Free-Rider Update):
     - Select Attack Mode: `FREE_RIDER` (Gradient delta scaled by $10^{-3}$).
     - Click `Start Enclave Training Job`.
     - Result panel flags:
       - Threat Level: `NONE (No malicious code or backdoor)`
       - Contribution Integrity: `FAIL (0.02 / 1.0, norm ratio 0.001 < 0.05 cohort threshold)`
       - Free-Rider Verdict: `"Update segregated: Zero-utility free-rider detected."`
       - Trust Score docked to: `42.0% (SUSPICIOUS)`.
       - Aggregation Weight assigned: `0.0000`.
- **Audit**:
  - Audit event `FREE_RIDER_DETECTED` recorded with zero-weight assignment receipt.

---

## Persona 3: Healthcare SOC Analyst

### Test Scenario HAT-SOC-03: Forensic Triage of Incident FS-034
- **Intent**: Investigate malicious model poisoning detected on node `H3 (Tata Memorial)`.
- **Actions**:
  1. In Command Center, click alert banner for `Incident FS-034`.
  2. Inspect Forensic Breakdown:
     - Threat Hypothesis: `MODEL_POISONING` (Confidence: 96%).
     - Spectral Cosine Divergence: $0.68 > 0.45$ threshold.
     - Blast Radius: Prevented $19.5\%$ global accuracy drop and $44.1\%$ target-class diagnostic failure.
  3. Click `Remediate Incident`.
  4. Modal presents options:
     - Option A: `Confirm Quarantine & Notify CISO`.
     - Option B: `Reinstate Hospital (False Positive Override)` with mandatory reason field.
  5. Select Option A: Consequence preview states node will remain locked out.
  6. Confirm: Audit block immutably anchors action.

---

## Persona 4: Compliance & Regulatory Auditor (ABDM / DPDP Act)

### Test Scenario HAT-AUD-04: Cryptographic Proof Verification
- **Intent**: Verify end-to-end cryptographic chain of custody for all clinical AI updates.
- **Actions**:
  1. Navigate to `/audit`.
  2. Inspect Merkle Tree Audit Blocks (e.g., Block #10).
  3. Click `Cryptographically Verify Chain`.
  4. Backend verifies SHA-256 parent hashes from Block #1 through Block #10.
  5. UI displays green shield: `CRYPTOGRAPHIC_INTEGRITY_VERIFIED (0 tampering detected)`.
  6. Export verifiable audit manifest as signed JSON.
