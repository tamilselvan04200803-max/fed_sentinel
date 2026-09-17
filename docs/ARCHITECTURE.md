# FedSentinel-Health System Architecture

## Overview
FedSentinel-Health is an enterprise-grade Zero-Trust security and Byzantine-robust aggregation platform designed for collaborative healthcare artificial intelligence.

"Don't trust the update. Verify it."

---

## Technical Honesty & Maturity Classification

| Subsystem | Maturity Level | Classification | Description |
|-----------|:--------------:|:--------------:|-------------|
| **Deep Learning Engine** | Level 2 (Pilot) | **REAL / LIVE** | PyTorch `MedicalImageCNN` (37,858 parameters) running on host CPU/GPU |
| **6-Layer Security Pipeline** | Level 2 (Pilot) | **REAL / LIVE** | L0 validation, L1 fingerprinting, L2 MAD anomaly detection, L3 influence, L4 robustness, L5 attribution |
| **Trust Scoring Formula** | Level 2 (Pilot) | **REAL / LIVE** | Multi-signal bounded scoring $T_i \in [0, 100]$ with dynamic quarantine threshold gating |
| **Tamper-Evident Ledger** | Level 2 (Pilot) | **REAL / LIVE** | Cryptographic SHA-256 hash-chained immutable audit log with `/api/audit/verify` verification |
| **Consortium Fleet** | Level 1 (Demo) | **SIMULATED** | 6 hospital nodes (Apollo, Johns Hopkins, St. Jude, Cleveland Clinic, Charité, Toronto General) running in-process |
| **Enclave Hardware Attestation** | Level 1 (Demo) | **SIMULATED** | `DemoAttestationProvider` producing reproducible synthetic PCR-4/PCR-10 quotes |
| **Hospital Fleet Sandbox** | Level 2 (Pilot) | **REAL / LIVE** | Real-time parameter tuning, simulated adversary injection, and interactive local training |

---

## Architectural Block Diagram

```
+-----------------------------------------------------------------------------------+
|                            HOSPITAL CLIENT ENCLAVES                               |
|                                                                                   |
|   +-----------------------+  +-----------------------+  +-----------------------+ |
|   | Hospital Node H1      |  | Hospital Node H2      |  | Hospital Node H3      | |
|   | Apollo Pulmonology    |  | Johns Hopkins Neuro   |  | St. Jude Pediatric    | |
|   | Local SGD Training    |  | Local SGD Training    |  | Injected Backdoor     | |
|   +-----------+-----------+  +-----------+-----------+  +-----------+-----------+ |
|               |                          |                          |             |
|               | Delta w_1                | Delta w_2                | Delta w_3   |
+---------------+--------------------------+--------------------------+-------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        FEDERATION GATEWAY CONTROL PLANE                           |
|                                                                                   |
|  [ Layer 0: Local Invariant Validation ]                                          |
|  - Tensor dimension verification (D = 37,858)                                     |
|  - IEEE 754 NaN / Inf eradication                                                 |
|  - L2 gradient norm thresholding (||Delta w|| < 50.0)                             |
|                                                                                   |
|  [ Layer 1: Privacy-Preserving Fingerprinting ]                                  |
|  - Cosine alignment to server Root-of-Trust gradient r_t                          |
|  - Peer-to-peer cohort correlation                                                |
|  - Random Gaussian projection (16 dimensions)                                     |
|                                                                                   |
|  [ Layer 2: Statistical Anomaly Detection ]                                       |
|  - Median Absolute Deviation (MAD) magnitude scoring                              |
|  - Directional spatial divergence calculation                                     |
|  - Composite Anomaly Score: A_i = alpha*A_dir + beta*A_mag + gamma*A_peer         |
|                                                                                   |
|  [ Layer 3: Leave-One-Out Influence Surface Analysis ]                            |
|  - Evaluates candidate performance impact on validation cohort                     |
|                                                                                   |
|  [ Layer 4: Counterfactual Robustness Testing ]                                   |
|  - Noise-induced prediction flip rate measurement (backdoor sensitivity)         |
|                                                                                   |
|  [ Layer 5: Group Attribution & Attestation ]                                     |
|  - Node identity and historical consistency matching                              |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        TRUST & CONSENSUS ENGINE                                   |
|                                                                                   |
|  Trust Score: T_i = 100 * (1 - [0.35 A_i + 0.25 I_i + 0.10 C_i + 0.10 R_i + 0.20 H_i]) |
|                                                                                   |
|  - If T_i <= 50.0% -> State = QUARANTINED, Aggregation Weight q_i = 0.0%          |
|  - If 50.0% < T_i <= 75.0% -> State = REVIEW, Weight throttled                    |
|  - If T_i > 75.0% -> State = TRUSTED, Full consensus weight                       |
|                                                                                   |
|  Aggregation: w_(t+1) = w_t + sum_i (q_hat_i * Delta w_i)                         |
+-----------------------------------------------------------------------------------+
```

---

## Directory Structure

- `backend/`
  - `api/routes/`: Modular FastAPI endpoints (auth, clients, training, federation, incidents, audit, model)
  - `core/`: Settings, constants, PBKDF2 authentication, and RBAC permission dependencies
  - `federation/`: PyTorch FederationCoordinator orchestrating end-to-end rounds
  - `ml/`: MedicalImageCNN model architecture, synthetic medical data generators, local SGD trainer, and server evaluator
  - `security/`: 6-layer Zero-Trust verification modules (L0, L1, L2, L3, L4, L5) and `AttestationProvider`
  - `services/`: Central `StateService` unifying coordinator, in-memory state, and audit ledger
  - `trust/`: Versioned `TrustPolicy` model and `TrustEngine`
- `src/`
  - `components/`: React 19 UI components across SOC Analyst and Hospital Workstation personas
  - `store/`: Zustand global state management
  - `types/`: Full TypeScript interface definitions matching backend models
- `tests/`
  - `test_invariants.py`: Property-based mathematical invariant tests
  - `test_security_pipeline.py`: Layer 0 through Layer 2 verification tests
  - `test_auth.py`: Cryptographic authentication and RBAC tests
  - `test_api_endpoints.py`: End-to-end FastAPI route tests
