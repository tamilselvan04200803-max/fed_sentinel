# FDA Sentinel Design Lessons for Federated Clinical AI

## Overview
The **FDA Sentinel Initiative** is the world's largest active post-market medical product safety surveillance system, linking data across dozens of healthcare organizations and hundreds of millions of patient records without centralizing electronic health records (EHR).

**FedSentinel-Health** adapts the foundational architectural and governance principles of the Sentinel System to modern **federated machine learning on confidential computing hardware** (TEE).

---

## 1. Core Architectural Mapping

| FDA Sentinel System Principle | Implementation in Sentinel | Implementation in FedSentinel-Health |
| :--- | :--- | :--- |
| **Distributed Data Network (DDN)** | Health plans and health systems maintain local data stores behind institutional firewalls. | Hospital nodes ($H_1 \dots H_5$) maintain local DICOM PACS and clinical datasets within hospital boundaries. |
| **Common Data Model (CDM)** | Standardized tables (Enrollment, Demographic, Dispensing, Encounter, Diagnosis). | Standardized DICOM PS 3.10 metadata, 224x224 grayscale tensor format, normalized pathology classes. |
| **Local Execution Sandbox** | SAS programs run locally within Data Partner environments; code is signed and audited. | PyTorch training runs locally within hardware-isolated Enclaves (Intel SGX / AMD SEV-SNP); measurements attested via PCR-0. |
| **Parameter-Driven Queries** | Parameterized query packages (Cohort Identification and Descriptive Analysis - CIDA). | Parameterized Federation Rounds: learning rate ($\eta$), local epochs ($E$), batch size ($B$), DP noise ($\sigma$). |
| **Zero Raw Data Exfiltration** | Only aggregated summary tables, hazard ratios, and counts return to the Operations Center. | Only clipped parameter gradient deltas ($\Delta W_i = W_i^{(t)} - W^{(t-1)}$) cross the federation gateway. |
| **Data Quality Review (QA)** | Automated modular QA programs check for missingness, implausible dates, and data anomalies. | 6-Layer Security Gate (L0 schema, L1 TEE attestation, L2 spatial anomaly, L3 free-rider norm, L4 DP noise, L5 Krum/Trimmed Mean). |
| **Provenance & Auditability** | Every query package has a unique identifier, version, parameter checksum, and run log. | Every round and model checkpoint has a deterministic SHA-256 digest, seed, and immutable hash-chain audit log. |

---

## 2. Key Operational Workflows Adapted to Federated AI

### Workflow A: Data Partner Qualification & Node Readiness
In the Sentinel System, a new Data Partner cannot participate in active surveillance queries until it passes comprehensive data characterization (QA Level 1, 2, and 3 checks).
In FedSentinel-Health, this translates to **Node Readiness Verification**:
1. **Cryptographic Attestation**: Hardware quote verified against Intel SGX Attestation Service or AMD SEV platform. PCR-0 measurement checked against golden binary hash.
2. **Dataset Conformance**: Local image repository scanned for DICOM PS 3.10 header compliance, class balance (Pneumonia, COVID-19, Normal), and verified exclusion of 18 HIPAA Safe Harbor direct identifiers (e.g., patient name, MRN, date of birth stripped).
3. **Network SLA**: Gateway latency $< 100\text{ms}$, packet loss $< 0.5\%$, TLS 1.3 mutual authentication (mTLS) handshake verified.

### Workflow B: Round Preflight & Feasibility
In Sentinel, an investigator tests a query package on dummy data or feasibility cohorts before distributing it across all partners to prevent failed runs and resource exhaustion.
In FedSentinel-Health, the operator must pass the **Interactive Preflight Gate**:
1. **Quorum Verification**: Checks that eligible active nodes $N \ge N_{\text{min}}$ (minimum 3 hospital nodes).
2. **Checkpoint Integrity**: Validates the SHA-256 hash of the global base weights $W^{(t-1)}$.
3. **Enclave Attestation Expiry**: Verifies all participating nodes hold active, non-expired attestation quotes.
4. **Quarantine Enforcement**: Prohibits inclusion of nodes under active security investigation ($H_5$ Malicious / Poisoned).

### Workflow C: Security Gating & Anomaly Triage
When Sentinel QA detects an anomalous rate of adverse events or corrupted diagnosis codes, the query coordinator flags the partner for review.
In FedSentinel-Health:
- If a node submits an empty or trivial gradient update ($\rho_i < 0.05$), the **Free-Rider Gate** flags contribution evasion, docks trust, and zeroes the aggregation weight ($w_i = 0.0000$).
- If a node submits anomalous cosine distance or directional flips, the **Spatial Anomaly Gate** drops the update and generates a high-severity security incident.

### Workflow D: Post-Round Evaluation & Promotion
After federated aggregation, the new global model checkpoint $W^{(t)}$ enters a structured evaluation phase:
- Validation on held-out benchmark datasets (Macro-F1, Sensitivity, Specificity, AUC).
- Byzantine resilience verification under synthetic noise attacks.
- Explicit human approval required to promote checkpoint from `STAGING` to `PRODUCTION`.

---

## 3. Truthful Language Standards Derived from Sentinel
1. **Do Not Say**: "HIPAA Certified Platform".
   - **Truth**: The US Department of Health and Human Services (HHS) does not certify software tools, platforms, or enclaves.
   - **Correct Term**: "HIPAA-Aligned Privacy Controls & Technical Safeguards (45 CFR § 164.312)".
2. **Do Not Say**: "Patient data never leaves the hospital".
   - **Truth**: Broad generalizations invite regulatory and cryptographic scrutiny.
   - **Correct Term**: "Raw clinical DICOM scans remain within local hospital trust boundaries; only clipped model gradient deltas ($\Delta W$) cross the zero-trust federation gateway."
3. **Do Not Say**: "Verified Attestation" for mock environments.
   - **Truth**: Development and demo environments often run without physical SGX/SEV silicon.
   - **Correct Term**: "SIMULATED ATTESTATION (DEV ENCLAVE)" vs "HARDWARE TEE ATTESTATION (INTEL SGX / AMD SEV)".
