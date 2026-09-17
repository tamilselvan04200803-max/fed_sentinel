# FedSentinel-Health: Human-Centered Design System Specification

## Overview
The FedSentinel-Health Design System defines the visual language, typography scales, density modes, component behaviors, and terminology standards for a mission-critical federated AI security platform.

---

## 1. Visual Foundation & Color Tokens

Our color tokens are designed for clinical AI command centers and cybersecurity operations centers (SOC) where visual fatigue must be minimized and status ambiguity cannot exist.

| Token | Class / Hex | Meaning & Context |
| :--- | :--- | :--- |
| **Background (Base)** | `bg-slate-950` (`#020617`) | Deep neutral background, reduces eye strain in 24/7 control rooms. |
| **Surface (Card/Panel)** | `bg-slate-900/80` (`#0f172a`) | Elevated container surface with subtle 1px border (`border-slate-800`). |
| **Surface Hover** | `bg-slate-800/60` (`#1e293b`) | Interactive hover state for table rows and cards. |
| **Primary Accent** | `sky-500` / `blue-500` | Federation coordinating events, navigation, active round telemetry. |
| **Success / Secure** | `emerald-500` / `green-500` | Quorum met, enclave attested, model weights within bounds, normal client. |
| **Warning / Caution** | `amber-500` / `yellow-500` | Free-rider alert, elevated gradient drift, non-fatal preflight warning. |
| **Destructive / Alert** | `rose-500` / `red-500` | Model poisoning detected, Byzantine node quarantined, quorum violation. |
| **Attestation Purple** | `violet-500` / `indigo-500` | Confidential computing hardware enclave quotes, PCR-0 measurement. |

---

## 2. Typography Standard (Human-First Reset)

### Mandatory Size Hierarchy
> [!IMPORTANT]
> **Zero Tiny Text Rule**: No substantive or human-readable information may be rendered at less than **13px**. The historical antipattern of `text-[10px]` or `text-[11px]` uppercase labels is strictly prohibited.

| Element | Font Size | Font Weight | Line Height | Typeface | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Page Title** | $24\text{--}28\text{px}$ (`text-2xl` to `text-3xl`) | Semibold (600) | $1.25$ | Inter / Sans | Page headers, main control room titles |
| **Section Header** | $18\text{--}20\text{px}$ (`text-lg` to `text-xl`) | Medium (500) | $1.35$ | Inter / Sans | Card titles, modal headers, wizard step titles |
| **Primary Body Text** | $15\text{--}17\text{px}$ (`text-base`) | Normal (400) | $1.5$ | Inter / Sans | Explanations, instructions, security rationale |
| **Interactive Labels & Buttons**| $14\text{--}15\text{px}$ (`text-sm` to `text-base`) | Medium (500) | $1.4$ | Inter / Sans | Action buttons, tabs, input labels, badge text |
| **Secondary & Captions** | $14\text{px}$ (`text-sm`) | Normal (400) | $1.4$ | Inter / Sans | Help text, timestamps, node specifications |
| **Table Cells & Data Rows** | $13\text{--}14\text{px}$ (`text-sm`) | Normal (400) | $1.4$ | Inter / Sans | Matrix values, status descriptions |
| **Technical Digests & Hashes** | $13\text{--}14\text{px}$ (`font-mono`) | Normal (400) | $1.3$ | JetBrains Mono | SHA-256 hashes, PCR-0 quotes, tensor shapes |
| **Large KPI Value** | $28\text{--}36\text{px}$ (`text-3xl` to `text-4xl`) | Bold (700) | $1.1$ | Inter / Sans | Quorum ratio ($4/5$), Global Accuracy ($89.4\%$) |

---

## 3. Readability & Density Switch

Operators work in different physical and visual environments. FedSentinel provides an application-wide Density Toggle stored in Zustand state and persisted to `localStorage`:

### A. `comfortable` Mode (Default)
- Target: Clinical directors, security auditors, standard desktop displays (1080p, 1440p).
- Spacing:
  - Table row height: $52\text{--}60\text{px}$ (`py-3.5` to `py-4`)
  - Primary button height: $42\text{--}44\text{px}$ (`h-11 px-5`)
  - Card inner padding: $24\text{px}$ (`p-6`)
  - Body font size: $16\text{px}$ (`text-base`)
  - Section gap: $24\text{px}$ (`gap-6`)

### B. `compact` Mode
- Target: SOC incident responders, multi-panel monitoring, laptops (1366x768).
- Spacing:
  - Table row height: $38\text{--}44\text{px}$ (`py-2` to `py-2.5`)
  - Primary button height: $34\text{--}36\text{px}$ (`h-9 px-3.5`)
  - Card inner padding: $16\text{px}$ (`p-4`)
  - Body font size: $14\text{px}$ (`text-sm`)
  - Section gap: $16\text{px}$ (`gap-4`)

---

## 4. Truth in Regulatory & Security Terminology

To maintain compliance and credibility with healthcare organizations, the following terminology rules are mandatory:

```
❌ FORBIDDEN: "HIPAA CERTIFIED"
✅ MANDATORY: "HIPAA-ALIGNED PRIVACY CONTROLS (45 CFR § 164.312)"

❌ FORBIDDEN: "Patient data NEVER leaves the enclave"
✅ MANDATORY: "Raw clinical DICOM scans remain within the local hospital boundary; only clipped model gradient deltas (ΔW) cross the federation gateway."

❌ FORBIDDEN: "VERIFIED ATTESTATION" (when running against simulated endpoints)
✅ MANDATORY: "SIMULATED ATTESTATION (DEV ENCLAVE)" vs "HARDWARE TEE ATTESTATION (INTEL SGX / AMD SEV)"

❌ FORBIDDEN: Fabricated random/polynomial chart points or fake benchmark numbers
✅ MANDATORY: Authoritative database records, or "NOT MEASURED" state with 1-click execution
```

---

## 5. Standard Component Guidelines

1. **StatusBadge**:
   - Distinctive colors for `HEALTHY`, `WARNING`, `CRITICAL`, `QUARANTINED`, `COMPLETED`, `IN_PROGRESS`.
   - Never use tiny `text-[10px]`! Minimum font size is `text-xs` ($12\text{--}13\text{px}$) with $14\text{px}$ padding.
2. **MetricCard**:
   - Clear human title ($14\text{--}15\text{px}$), bold numerical value ($28\text{--}36\text{px}$), and contextual subtitle explaining what normal looks like ($13\text{--}14\text{px}$).
3. **Operational Modals & Wizards**:
   - Multi-step guided wizards (`Preflight` $\to$ `Quorum` $\to$ `Review` $\to$ `Execution`).
   - Explicit confirmation for destructive actions (e.g. Quarantining a node with confirmation dialog stating quorum impact).
