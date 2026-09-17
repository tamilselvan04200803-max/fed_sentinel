# FedSentinel-Health SecOps Incident Response Playbooks

Standard operating procedures for Healthcare SecOps teams when managing federated learning security alerts.

---

## Playbook 1: Automated Node Quarantine (SOP-SEC-01)

### Trigger Conditions
- Anomaly score $A_i \ge 0.70$
- Layer 2 direction or magnitude anomaly in `FAIL` status
- Composite trust score $T_i \le 50.0\%$

### Immediate System Actions (Automated)
1. Aggregation weight for node $i$ is immediately clamped to $q_i = 0.0\%$.
2. Node update $\Delta w_i$ is excluded from the active round consensus.
3. Incident record `FS-{ROUND}-{CLIENT}` is created with full 6-layer forensic evidence package.
4. SHA-256 tamper-evident audit record logged to the ledger.
5. Real-time WebSocket notification dispatched to SOC Analyst dashboard.

### Analyst Review Workflow
1. Navigate to **Investigation Lab** on the SOC Analyst dashboard.
2. Select the flagged incident and inspect the **6-Layer Verification Verdict**.
3. Review the **Blast Radius Projection**:
   - Check Projected Attack Success Rate (ASR).
   - Check Target Class Degradation (e.g. Glioblastoma Class 7 drop).
4. Inspect the **Input Preview Grid** and activation norm patterns.
5. Choose appropriate action:
   - **Confirm Quarantine**: Lock node status; issue notice to hospital IT team.
   - **Request Additional Evidence**: Query hospital enclave for PCR quote attestation.
   - **Override / Reinstate**: If legitimate non-IID data shift is verified by clinical research lead, reinstate node with audited justification.

---

## Playbook 2: Backdoor Watermark Detection (SOP-SEC-02)

### Trigger Conditions
- Layer 4 Robustness score $R_i \le 0.40$ (high prediction flip rate under noise)
- Layer 3 counterfactual risk flagged on specific diagnostic target class

### Analyst Investigation Steps
1. Verify whether the target hospital (e.g. H3) recently ingested a new clinical dataset cohort.
2. Check if the trigger pattern is localized (e.g. 3x3 pixel border watermark).
3. Check PCR runtime measurements in the **Attestation Report**.
4. Enforce quarantine and isolate model version checkpoint:
   - If backdoor penetrated consensus prior to detection, execute **Model Rollback** via `/api/model/rollback`.

---

## Playbook 3: Model Rollback Procedure (SOP-SEC-03)

### Purpose
Safely restore global consensus model to a known-clean historical checkpoint without losing federation audit lineage.

### Execution
1. Identify the last validated clean round ID (e.g. Round 23 before Round 24 attack).
2. Issue rollback command via UI or API:
   ```http
   POST /api/model/rollback
   Content-Type: application/json
   
   {
     "target_round_id": 23,
     "reason": "Backdoor trigger discovered in Round 24 gradient submission from quarantined node H3"
   }
   ```
3. System verifies checkpoint file `models/global_model_round_23.pt` and matching SHA-256 parameter digest.
4. Active model version pointer updated to `global-model-v23`.
5. Cryptographic audit event `MODEL_ROLLBACK_EXECUTED` chained into the immutable ledger.
