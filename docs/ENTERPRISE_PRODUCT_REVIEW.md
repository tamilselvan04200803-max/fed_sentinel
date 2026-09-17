# FedSentinel-Health Enterprise Product Review

> **Audit Date**: 2026-09-16  
> **Scope**: Complete repository inspection — 72 Python files (3,923 LOC), 43 TSX files (8,246 LOC), 35 OpenAPI paths, 15 ORM models, 17 passing tests

---

## 1. What Is the Product?

FedSentinel-Health is a **Zero-Trust control plane for federated clinical AI**. It enables multiple hospital nodes to collaboratively train a shared diagnostic model while keeping patient data strictly local. Every model gradient update is verified through a 6-layer security pipeline before it can influence the global consensus.

The core proposition is: **"Don't trust the update. Verify it."**

The platform serves three simultaneous purposes:
1. **Operational control plane** — orchestrate federated learning rounds across a hospital consortium
2. **Security operations center** — detect, investigate, and contain adversarial attacks on the learning process
3. **Evidence system** — maintain a cryptographically verifiable audit trail of every decision

This is not a visualization dashboard. It is a platform where federation rounds execute, security verdicts are computed, trust scores change, incidents are created, and models evolve — all driven by real PyTorch computations.

---

## 2. Who Are Its Users?

| Persona | Role | Primary Concern |
|---------|------|-----------------|
| **SOC Analyst** | Security operations | "Is someone attacking the federation? What should I do?" |
| **Hospital AI/ML Engineer** | Node operator | "Is my hospital's model performing? Are my updates accepted? Why was I quarantined?" |
| **Federation Administrator** | Platform operator | "Which hospitals are participating? Is the model improving? Do we have quorum?" |
| **Security Officer (CISO)** | Risk management | "What is the security posture? What incidents are open? What evidence do we have?" |
| **Executive** | Strategic oversight | "What is this platform? Is it working? What happened? What is real?" |

**All five personas operate within one platform.** The experience is role-aware but unified.

---

## 3. What Are the Primary Workflows?

### Workflow A: Federation Round Lifecycle
```
Admin selects participants → Round starts → Hospitals train locally →
Gradient deltas submitted → 6-layer security pipeline evaluates each →
Trust scores update → Quarantine decisions made → Aggregation executes →
Global model updates → Round completes → Audit trail created
```

### Workflow B: Attack Detection and Response
```
Anomaly detected in gradient update → Composite anomaly score > threshold →
Trust score drops → Node quarantined → Incident created →
SOC analyst investigates evidence (L0-L5) → Confirms quarantine OR reinstates →
Audit event logged → Federation continues without compromised node
```

### Workflow C: Hospital Local Operations
```
Hospital operator configures training params → Executes local SGD →
Generates gradient delta → Submits to federation → Receives verdict →
If clean: accepted into aggregation → If attack detected: quarantined →
Operator sees evidence, files appeal if warranted
```

### Workflow D: Forensic Investigation
```
Analyst receives alert → Opens incident → Reviews blast radius →
Steps through 6-layer evidence (L0: validation, L1: fingerprint, L2: anomaly,
L3: influence, L4: robustness, L5: attribution) → Reviews trust impact →
Takes action (confirm quarantine / override reinstate) → Action audited
```

### Workflow E: Model Governance
```
View current model version → Inspect architecture/parameters →
Review performance metrics → Compare aggregation strategies →
If degraded: rollback to previous checkpoint → Audit trail created
```

---

## 4. What Is Currently Implemented?

### Genuinely Live (Grade A/B)
- Real PyTorch `MedicalImageCNN` (37,858 parameters) training and inference
- 6-layer Zero-Trust security pipeline (L0-L5) with real computations
- Trust scoring formula with 5 weighted signals and quarantine threshold gating
- 4 Byzantine-robust aggregation strategies (Trust-Weighted, Multi-Krum, Trimmed-Mean, FedAvg)
- SHA-256 hash-chained tamper-evident audit ledger with cryptographic verification
- Attack injection (5 types: backdoor, label-flip, model poisoning, free-rider, clean)
- WebSocket real-time event streaming
- Dual-persona frontend (SOC Analyst / Hospital Workstation)
- 43 React components across 11 functional areas
- Clinical Model Card and SystemTruthPanel (technical honesty)
- 17 automated tests covering invariants, security, auth, API

### Functional But With Gaps (Grade C)
- Authentication exists but hand-rolled JWT, most routes unprotected
- RBAC defined (7 roles) but unenforced
- Database schema defined (15 ORM models) but completely disconnected from runtime
- Frontend state management works but is duplicated (Zustand + Context)
- L3-L5 security layers functional but with shortcuts (label anomaly is proxy)

### Simulated/Demo Only (Grade D/E)
- Hardware attestation (DemoAttestationProvider with synthetic PCR quotes)
- Multi-tenancy (TenantAccessChecker defined, never applied)
- Drift monitoring (returns hardcoded values)
- Usage metering (returns static entitlements)
- Differential Privacy (code exists, disabled, untested in aggregation path)

---

## 5. What Is Still a Demo?

The most important distinction: **the core ML and security pipeline is real. The operational infrastructure around it is demo-grade.**

| Capability | Reality |
|-----------|---------|
| PyTorch training | Real. Actual SGD optimization runs. |
| Security pipeline (L0-L2) | Real. Tested. MAD statistics, cosine distance, norm clipping. |
| Trust computation | Real. Mathematical formula with tested invariants. |
| Aggregation | Real. 4 strategies with actual tensor operations. |
| Audit chain | Real. SHA-256 hash chain with verification endpoint. |
| Persistence | **Demo**. All state lost on restart. |
| Authentication | **Demo**. Works but bypassed in demo mode. Most routes unprotected. |
| Multi-tenancy | **Demo**. Single-org hardcoded data. |
| Drift monitoring | **Fake**. Returns hardcoded numbers. |
| TPM attestation | **Simulated**. Synthetic PCR quotes. |
| Hospital fleet | **Simulated**. 6 in-process nodes, not real distributed clients. |

---

## 6. What Architecture Is Strong?

1. **Security Pipeline Design** — The 6-layer gateway is the product's core intellectual property. Each layer has a clear mathematical basis. Layer 2's MAD-based anomaly detection is particularly well-implemented.

2. **Trust Engine** — The multi-signal trust formula with versioned policies, non-linear amplification for high-anomaly nodes, and quadratic aggregation weighting is genuinely sophisticated.

3. **FederationCoordinator** — The `execute_round()` lifecycle is clean and complete: train → pipeline → trust → quarantine → aggregate → evaluate → broadcast.

4. **Backend Domain Decomposition** — 7 modular API routers, clean separation of `security/`, `trust/`, `ml/`, `federation/`, `services/`.

5. **Technical Honesty System** — The `SystemTruthPanel` classifying every capability as REAL/SIMULATED/ROADMAP is rare and genuinely differentiating.

6. **ORM Schema** — The 15-table schema is well-designed for enterprise multi-tenancy (Organization → Facility → User → Federation → Membership). It's the right architecture — it's just unused.

---

## 7. What Architecture Is Weak?

1. **Database Disconnection** — This is the single largest architectural weakness. 15 ORM models exist but zero API routes read or write them. `StateService` is a pure in-memory singleton. Server restart = total state loss.

2. **Dual State Management** — Both Zustand store (220 lines) and React Context (769 lines) manage overlapping concerns (navigation, data, auth, modals, toasts). Neither is authoritative. Components randomly import from either.

3. **Missing Auth Enforcement** — `get_current_user()` is a `Depends()` function but only 4 of 35 endpoints actually use it. A trivial cURL command can call `/api/simulation/start` or `/api/model/rollback` without any authentication.

4. **WebSocket Security** — Both WebSocket endpoints (`/ws/events`, `/ws/live`) accept connections from any client without authentication. Any browser on the network can subscribe to all federation telemetry.

5. **Frontend Data Fetching** — `App.tsx` makes raw `fetch()` calls in a `useEffect` with no caching, no loading states, no error recovery, no stale data management. The `FedSentinelContext` has its own separate `fetchData()` function doing the same thing.

6. **No API Error Contract** — Errors come back as `HTTPException` with varying JSON shapes. Some return `{"detail": "..."}`, others return `{"error": "...", "message": "..."}`. The frontend catches errors with bare `try/catch` blocks.

---

## 8. What Frontend Debt Exists?

### Structural Debt
- **Dual state managers**: Zustand + Context both hold clients, rounds, incidents, auth, modals, toasts. No clear ownership boundary.
- **No router**: All navigation is via Zustand `activeTab` state and conditional rendering in `App.tsx`. No URL-based navigation. No deep links. No back button.
- **Raw fetch in components**: `HospitalWorkstation`, `InvestigationPage`, `SecurityOverview` all call `fetch()` directly with inline URL construction.
- **No data layer**: No query caching, no stale time, no refetch on focus, no optimistic updates, no mutation handling.
- **No error boundaries per route**: Single global `ErrorBoundary`. No granular error recovery.
- **Mock data scattered**: `mockData.ts` (389 lines) and `demoFixture.ts` (50 lines) are separate offline datasets. Context has its own `MOCK_*` imports with different data shapes.

### Visual/UX Debt
- **`glass-panel` overuse**: Most cards use glassmorphism with cyan glows. Creates visual clutter at scale.
- **PCA scatter plot generates random data**: `SecurityOverview.tsx` lines 56-77 create `Math.random()` PCA points in `useMemo`. This is frontend-fabricated data, not backend evidence.
- **No loading skeletons**: Most pages show nothing during load, then pop in.
- **No empty states on critical pages**: Rounds page, Trust Center, Model Center have no designed empty states.
- **No responsive design**: `max-w-7xl mx-auto` is the only layout constraint. No tablet/mobile handling.
- **Inconsistent spacing**: Some components use `space-y-6`, others `gap-4`, others `mb-3`. No design system.
- **Large monolithic components**: `HospitalWorkstation.tsx` (677 lines), `InvestigationPage.tsx` (475 lines), `ClientsPage.tsx` (495 lines) — too large to maintain.

### Type Safety Debt
- `| string` union escape hatches on `ClientStatus`, `RoundStatus`, `threat_hypothesis` — weaken discriminated unions
- `[key: string]: any` index signature on `IncidentEvidenceSummary` — defeats type checking
- `useState<any>` in `HospitalWorkstation` for `trainResult` and `inferenceResult`

---

## 9. What Backend Gaps Affect Frontend?

| Backend Gap | Frontend Impact |
|-------------|----------------|
| No persistence | Frontend shows stale data after restart. Demo resets are destructive. |
| No RBAC enforcement | Frontend "hides" buttons by role but backend accepts any call — security theater |
| No pagination | `/api/audit/logs` returns entire ledger. Frontend will hang with 10,000 events |
| No WebSocket auth | Frontend connects without token. Anyone on the network can see telemetry |
| No error contract | Frontend can't show meaningful errors — just catches `Error` objects |
| No API versioning | Frontend coupled directly to current JSON shape — any backend change breaks UI |
| Hardcoded drift data | Frontend shows static drift metrics that never change regardless of actual rounds |
| No session refresh | If JWT expires, frontend just gets silent 401s with no recovery path |

---

## 10. What Are the Most Important Product Gaps?

**In priority order** (highest impact on credibility first):

1. **Persistence** — An enterprise product that loses all data on restart is immediately disqualifying
2. **Authorization enforcement** — Routes that accept unauthenticated calls undermine the entire zero-trust narrative
3. **Frontend data architecture** — Raw fetch calls without caching, loading, or error handling make the app feel fragile
4. **State management coherence** — Two competing state systems create bugs and confusion
5. **Frontend-fabricated data** — PCA scatter plot with `Math.random()`, hardcoded drift metrics, static usage numbers
6. **No URL routing** — Cannot share a link to a specific incident, round, or client
7. **Component decomposition** — 500+ line monolithic components
8. **Information architecture** — Navigation labels don't match product concepts (e.g., "Audit" tab shows Trust Center, not audit logs)

---

## 11. What Should NOT Be Built?

| Avoid | Reason |
|-------|--------|
| AI chat assistant (Ollama/LiteLLM) | Core platform isn't stable enough. AI would hallucinate over fake data. |
| Kubernetes deployment | Modular monolith is correct for this scale. K8s is theatre. |
| Multi-federation management UI | Only one federation exists. Build the architecture, not the UI. |
| Billing/subscription system | No real customers. Enterprise framing is sufficient. |
| Mobile app | Desktop is the primary enterprise experience. |
| E2E encryption overlay | Would add complexity without demonstrable value. |
| Custom charting library | Recharts works. Don't replace it. |
| GraphQL layer | REST is working. Adding GraphQL doubles the API surface. |
| Feature flag platform | Simple config is sufficient. LaunchDarkly is overkill. |
| CDC/event sourcing | In-memory state with DB persistence is appropriate. |

---

## 12. What Should Be Built Next?

### Tier 1 — Foundation (Must Complete Before Any Frontend Work)
1. **Database persistence layer** — Wire ORM models to StateService
2. **Authentication enforcement** — Require auth on all mutating endpoints
3. **API error contract** — Standardized error response schema
4. **API pagination** — All list endpoints return paginated responses

### Tier 2 — Frontend Architecture
5. **TanStack Query** — Replace all raw fetch with cached, stale-managed queries
6. **State ownership resolution** — Zustand for UI state, TanStack Query for server state, deprecate Context
7. **URL routing** — React Router or TanStack Router for deep-linkable routes
8. **Design system foundation** — Evaluate shadcn/ui, build reusable primitives
9. **Remove frontend-fabricated data** — PCA chart, drift numbers must come from backend or be clearly labelled

### Tier 3 — Product Quality
10. **Information architecture** — Align navigation labels to product concepts
11. **Component decomposition** — Break monolithic pages into composed feature modules
12. **Loading/error/empty states** — Every route gets designed states
13. **Frontend testing** — Vitest + RTL for critical components

### Tier 4 — Enterprise Polish
14. **Command palette** — Keyboard-driven navigation
15. **Global search** — Across clients, rounds, incidents, audit
16. **System health dashboard** — Real backend health data
17. **Executive landing experience**

---

## 13. What Should the Final Enterprise UX Look Like?

### Application Shell
- **Left sidebar navigation** (collapsible) with icon + label
- **Top bar**: Organization name, federation selector, system status indicators, user menu
- **Breadcrumbs**: contextual path (e.g., Security Operations → Incidents → FS-034)
- **Command palette**: `Ctrl+K` / `⌘K` for keyboard navigation

### Information Architecture

| Route | Purpose | Content |
|-------|---------|---------|
| `/` | **Command Center** | System status, active round, security posture, health summary, attention items |
| `/federation` | **Federation** | Round history, round execution, participant management, aggregation strategies |
| `/trust` | **Trust Center** | Node trust scores with explainability, trust policies, historical trends |
| `/security` | **Security Operations** | Security pipeline configuration, detection thresholds, defense mode |
| `/incidents` | **Incidents** | Incident list, forensic investigation workspace, triage actions |
| `/models` | **Model Center** | Model status, architecture, model card, version lineage, rollback |
| `/hospital/:id` | **Hospital Workstation** | Local training, inference, status, trust profile, appeal |
| `/audit` | **Audit & Evidence** | Audit log search, hash chain verification, evidence export |
| `/admin` | **Administration** | Organization, facilities, users, federation config |
| `/health` | **System Health** | Service status, database, WS, coordinator, pipeline health |

### Visual Language
- **Dark slate base** (keep current `slate-950` foundation)
- **Reduce glassmorphism** to navigation and modals only, not every card
- **Status colors**: emerald (healthy), amber (warning), rose (critical), cyan (info) — already defined, enforce consistency
- **Typography**: Inter for UI, JetBrains Mono for hashes/IDs/code — already configured
- **Information density**: More data, less decoration. Enterprise users want density.
- **Minimal animation**: Reserve for state transitions only, not decorative

### Interaction Patterns
- **Every KPI drills down** — clicking "3 Quarantined" navigates to filtered client list
- **Every incident has a full investigation path** — Detection → Evidence → Action → Audit
- **Every trust score is explainable** — Component breakdown, formula, historical trend
- **Every action creates an audit event** — Visible in the audit trail
- **Every dangerous action has a confirmation dialog** — Quarantine, reinstate, rollback
