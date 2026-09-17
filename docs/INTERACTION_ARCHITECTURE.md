# Interaction Architecture & Human-in-the-Loop Design

## 1. The 10-Step Product Paradigm

Every user interaction across FedSentinel-Health follows the deterministic 10-step lifecycle:

```
[1. INTENT]
   User recognizes a clinical, operational, or security objective.
      |
[2. INPUT]
   User specifies domain parameters (nodes, hyperparameters, thresholds).
      |
[3. CLIENT VALIDATION]
   Immediate clientside form validation (ranges, types, required fields).
      |
[4. PREFLIGHT GATE]
   Backend validates system state (Quorum, Attestation, Model integrity).
   Returns: READY | WARNING | BLOCKED with remediation suggestions.
      |
[5. ACTION CONFIRMATION]
   Consequence review modal showing blast radius, targets, and expected outcomes.
      |
[6. LIVE EXECUTION]
   Real-time stage progression stepper, epoch curves, cancellation support.
      |
[7. DECOMPOSED RESULT]
   Multi-dimensional metrics (Loss, Accuracy, Anomaly breakdown, Trust change).
      |
[8. EXPLANATION & TRANSPARENCY]
   Mathematical derivations, plain-language clinical rationale, no black boxes.
      |
[9. ACTIONABLE NEXT STEPS]
   Contextual buttons: "Inspect Audit Block", "Investigate Node", "Export Model Card".
      |
[10. IMMUTABLE AUDIT TRAIL]
   Cryptographic Merkle tree block committed with actor, timestamp, and SHA-256 hash.
```

---

## 2. Preflight Check Design & State Contracts

The preflight phase acts as an automated flight check before any safety-critical federated learning or administrative action is executed.

### Preflight States & Visual Presentation

| Preflight State | Visual Token | Behavioral Contract | User Action Allowed |
|:---|:---|:---|:---|
| **READY** | Emerald green badge, checkmark icon | All prerequisites satisfied. Quorum confirmed. Checksum verified. | Primary action button enabled (`"Confirm & Launch"`). |
| **WARNING** | Amber badge, alert triangle icon | Operation can proceed safely, but non-blocking risks exist (e.g., node latency elevated, 1 node in observation). | Primary action enabled with explicit `"Acknowledge & Proceed"` confirmation. |
| **BLOCKED** | Rose-red badge, octagonal stop icon | Critical invariant violated (e.g., quorum not met, model checkpoint missing, all selected nodes quarantined). | Primary action strictly disabled. Direct remediation links provided. |

### Preflight Response Schema (`POST /api/rounds/preflight`)
```json
{
  "status": "READY",
  "checks": [
    {
      "name": "Consortium Quorum",
      "status": "PASS",
      "message": "4 of 5 selected nodes active and unquarantined (Min required: 3)"
    },
    {
      "name": "Model Checkpoint Integrity",
      "status": "PASS",
      "message": "Base model v24 SHA-256 verified (37,858 parameters)"
    },
    {
      "name": "Hardware TEE Attestation",
      "status": "PASS",
      "message": "Intel SGX certificates valid across all candidate nodes"
    },
    {
      "name": "Dataset Schema Conformance",
      "status": "WARN",
      "message": "H4 - Apollo Hospitals reporting lower sample count (180 samples)"
    }
  ],
  "quorum": {
    "required": 3,
    "available": 4,
    "met": true
  },
  "eligible_clients": ["H1", "H2", "H4", "H5"],
  "excluded_clients": [
    {
      "client_id": "H3",
      "reason": "Node currently in QUARANTINED state (Incident FS-034)"
    }
  ],
  "estimated_duration_seconds": 4.5,
  "remediation_actions": []
}
```

---

## 3. Action-Consequence Mapping

In healthcare AI and clinical security, **blind execution is unacceptable**. Users must always be presented with the explicit consequences of an action before it is enacted.

### Confirmation Modal Architecture
Whenever an operator triggers an action that alters consortium state (e.g., Launching a Round, Quarantining a Node, Reinstating a Node, Rolling Back a Model):

1. **Target Identification**: Explicitly state the target entity (e.g., `Tata Memorial Hospital (H3)`).
2. **Immediate Technical Impact**:
   - For Quarantine: *"Target client will receive weight = 0.0000 in upcoming rounds. Local updates will be discarded. Hospital CISO will be alerted."*
   - For Reinstatement: *"Target client trust score will be restored to 80.0%. Status changed to REVIEW. Node will be eligible to participate in Round 25."*
   - For Model Rollback: *"Active global weights will revert to Round 22 (Accuracy: 93.8%). Checkpoints for Rounds 23-24 will be archived. All consortium nodes will be notified to synchronize."*
3. **Mandatory Rationale**: User must provide an audit reason for all administrative overrides.
4. **Audit Immutability Notice**: *"This action will be signed with your credentials and immutably anchored in SHA-256 Merkle Block #11."*

---

## 4. Explanatory Transparency & Score Decomposition

A core requirement of FedSentinel-Health is that **no score or verdict is presented as an unexplained magic number**.

### Trust Score Explanation Pattern
When an operator inspects a node's trust score ($T_i$):
- **Composite Display**: $88.5\%$
- **Mathematical Decomposition Accordion**:
  $$\text{Score} = 100 \times \left(1 - \left[0.35 \times A_i + 0.25 \times I_i + 0.10 \times C_i + 0.10 \times R_i + 0.20 \times H_i\right]\right)$$
  - $A_i$ (Spatial Anomaly): $0.08$ (Low spatial divergence)
  - $I_i$ (Influence Penalty): $0.02$ (Descent aligned)
  - $C_i$ (Contribution Integrity Penalty): $0.05$ (High update utility)
  - $R_i$ (Robustness Penalty): $0.06$ (Perturbation stable)
  - $H_i$ (Historical Anomaly Track): $0.00$ (No prior infractions)
- **Plain-Language Summary**:
  *"AIIMS New Delhi exhibits consistent, high-utility model contributions with valid hardware TEE attestation and zero detected adversarial patterns."*

---

## 5. The Zero-Dead-End Principle

No screen, modal, or workflow termination in FedSentinel-Health shall leave the user without a clear, actionable next step:

```
[Round Completed]  ---> [Inspect Merkle Audit Block] | [View Model Card] | [Triage Incidents]
[Incident Closed]  ---> [Return to Incident Feed]    | [Review Trust Center] | [Trigger Enclave Health Scan]
[Training Job Done]---> [Inspect Enclave Gradients]  | [Verify Merkle Proof] | [Join Federation Round]
[Model Rolled Back]---> [Deploy to Enclaves]         | [Inspect Lineage Log] | [Run Robustness Benchmark]
```
