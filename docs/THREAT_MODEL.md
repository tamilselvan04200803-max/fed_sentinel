# FedSentinel-Health Threat Model & Security Specification

## 1. System Scope & Assets

FedSentinel-Health protects three primary assets in federated clinical environments:

1. **Global Clinical Model Checkpoint ($w_t$)**: The consensus neural network deployed for diagnostic decision support across hospitals.
2. **Private Patient Health Information (PHI)**: Local diagnostic scans and clinical labels residing inside hospital premises.
3. **Consortium Integrity & Audit Ledger**: The historical chain of update validations, quarantine decisions, and administrative actions.

---

## 2. Threat Classification & Mitigations

| Threat Vector | Attacker Objective | FedSentinel Detection Layer | Defense Outcome |
|---------------|-------------------|----------------------------|-----------------|
| **Model Poisoning / Gradient Inversion** | Force global model accuracy collapse by scaling or inverting gradient directions | Layer 0 (Norm Clipping) + Layer 2 (MAD & Direction Anomaly) | Update flagged ($A_i > 0.85$), trust score dropped to $<30\%$, node quarantined |
| **Backdoor Trigger Injection** | Embed watermark pattern (e.g. 3x3 pixel trigger) forcing misclassification of target pathology | Layer 4 (Perturbation Flip Rate) + Layer 3 (Influence Surface) | High prediction inconsistency under noise, trigger sensitivity isolated |
| **Label Poisoning / Flip Attack** | Invert ground-truth clinical diagnostic classes (Pneumonia $\leftrightarrow$ Normal) | Layer 1 (Cosine to Centroid) + Layer 2 (Direction Anomaly) | Update diverges from cohort consensus, quarantined or flagged for review |
| **Free-Rider Attack** | Submit negligible or zero-gradient updates to consume global model without contributing compute | Layer 0 (Norm Floor) + Layer 1 (Sparsity Check) | Update norm flagged as sub-threshold; node penalized |
| **Sybil / Collusion Attack** | Coordinate multiple nodes to skew aggregation toward poisoned update | Layer 2 (Robust Median/MAD) + Multi-Krum Aggregation | Byzantine updates excluded from median; centroid preserved |
| **Audit Ledger Tampering** | Retroactively alter incident records or unquarantine a rogue node without authorization | Cryptographic SHA-256 Hash Chaining (`/api/audit/verify`) | Tampered record index immediately detected by hash divergence |

---

## 3. The 6-Layer Zero-Trust Verification Pipeline

```
Raw Client Update Delta w_i
          |
          v
[ LAYER 0: Local Invariant Validation ]
  - Checks: IEEE 754 NaN/Inf, Dimension == 37,858, L2 Norm <= 50.0
          |
          v
[ LAYER 1: Privacy-Preserving Fingerprinting ]
  - Non-invertible mathematical signature: norm, cosine to root, peer similarity, random projection
          |
          v
[ LAYER 2: Statistical Anomaly Engine ]
  - Robust Median Absolute Deviation (MAD) magnitude scoring
  - Directional cosine alignment: A_dir = (1 - S_i) / 2
  - Composite anomaly: A_i = 0.35 A_dir + 0.25 A_mag + 0.25 A_peer + 0.15 A_label
          |
          v
[ LAYER 3: Counterfactual Influence Analysis ]
  - Leave-one-out candidate model evaluation: I_i = Acc(G_-i) - Acc(G_all)
          |
          v
[ LAYER 4: Perturbation Robustness Testing ]
  - Noise perturbation flip rate: measures model sensitivity to backdoor watermarks
          |
          v
[ LAYER 5: Group Attribution & Attestation ]
  - Historical pattern similarity and node signature verification
          |
          v
Mathematical Trust Score Computation -> Trust Engine Gating
```
