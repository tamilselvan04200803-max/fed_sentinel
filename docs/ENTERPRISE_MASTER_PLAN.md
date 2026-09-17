# FedSentinel-Health Enterprise Master Plan

> **Based on**: ENTERPRISE_PRODUCT_REVIEW, FRONTEND_ARCHITECTURE, FRONTEND_BACKEND_CONTRACT, ENTERPRISE_GAP_AUDIT, ARCHITECTURE_DECISIONS  
> **Execution Model**: 6 parallel tracks with dependency gates  
> **Constraint**: All 17 existing tests must pass at every checkpoint

---

## Execution Gate System

| Gate | Prerequisite | Validates |
|------|-------------|-----------|
| **G1** | Repository understanding | All documents produced ✅ |
| **G2** | Architecture decisions | FRONTEND_ARCHITECTURE.md approved ✅ |
| **G3** | Design system | shadcn/ui installed, tokens defined, 5 core primitives working |
| **G4** | API contract | Missing endpoints created, pagination added, error contract implemented |
| **G5** | Auth/AuthZ | All mutating routes require auth. RBAC enforced. WebSocket secured. |
| **G6** | Core journeys | Command Center, Federation, Incidents, Hospital, Audit navigable with data |
| **G7** | Testing | Vitest running, 20+ component tests, 5+ integration tests |
| **G8** | Security verification | Rate limiting active, security headers, no unauthed mutation |
| **G9** | Performance | Route splitting active, bundle analysis completed |
| **G10** | Executive walkthrough | Full demo sequence works end-to-end, all truth labels correct |

---

## TRACK A — PLATFORM / BACKEND

### A1: Database Persistence

**Objective**: Wire existing 15 ORM models to StateService so state survives restarts.

**Files**:
- `backend/services/state_service.py` — Add `_persist()` and `_hydrate()` methods
- `backend/db/database.py` — Add `create_all()` + session factory
- `backend/db/repository.py` — Implement CRUD repository pattern for Client, Round, Incident, AuditEvent

**Dependencies**: None (foundation)  
**API Contract**: No API changes — same responses, backed by DB instead of memory  
**UI Impact**: Data persists across server restarts  
**Security Impact**: None  
**Tests**: Test that `state_service` data survives a simulated restart  
**Acceptance**: `pytest tests/ -v` green. Restart server. `GET /api/clients` returns same data.  
**Rollback**: Revert to pure in-memory (the current code path remains as fallback)

---

### A2: API Error Contract

**Objective**: Standardize all error responses to a consistent JSON shape.

**Files**:
- `backend/core/errors.py` [NEW] — `ErrorResponse` Pydantic model, custom exception handlers
- `main.py` — Register exception handlers
- All route files — Use `ErrorResponse` for HTTP 4xx/5xx

**Response Shape**:
```json
{
  "error": "INCIDENT_NOT_FOUND",
  "message": "Incident FS-999 does not exist",
  "status": 404,
  "timestamp": "2026-09-16T12:00:00Z"
}
```

**Dependencies**: None  
**API Contract**: All errors follow same shape  
**UI Impact**: Frontend can parse errors consistently  
**Tests**: Test 404, 401, 403, 422, 500 all return `ErrorResponse`  
**Acceptance**: Every error endpoint returns JSON matching schema  
**Rollback**: Remove exception handlers

---

### A3: API Pagination

**Objective**: All list endpoints return paginated responses.

**Files**:
- `backend/schemas/common.py` [NEW] — `PaginatedResponse[T]` generic
- `backend/api/routes/audit_routes.py` — `GET /api/audit/logs?page=1&size=50&actor=&action=`
- `backend/api/routes/client_routes.py` — `GET /api/clients?page=1&size=50&status=`
- `backend/api/routes/incident_routes.py` — `GET /api/incidents?page=1&size=50&severity=`
- `backend/api/routes/federation_routes.py` — `GET /api/rounds?page=1&size=20`

**Response Shape**:
```json
{
  "items": [...],
  "total": 142,
  "page": 1,
  "page_size": 50,
  "pages": 3
}
```

**Dependencies**: A1 (pagination is most useful with persisted data)  
**API Contract**: Breaking change to list endpoints — frontend must adapt  
**UI Impact**: Frontend can paginate large datasets  
**Tests**: Test pagination math, boundary conditions  
**Acceptance**: `GET /api/audit/logs?page=2&size=10` returns correct slice  
**Rollback**: Accept `page` param but default to returning all if omitted

---

### A4: Missing Backend Endpoints

**Objective**: Create endpoints required by the frontend contract.

**New Endpoints**:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/rounds/{round_id}` | Round detail with pipeline results |
| `GET /api/model/versions` | Model version history list |
| `GET /api/security/config` | Current pipeline configuration |
| `POST /api/ws/ticket` | Short-lived WebSocket connection ticket |
| `GET /api/dashboard/summary` | Aggregated KPIs for command center |

**Files**:
- `backend/api/routes/federation_routes.py` — Add round detail
- `backend/api/routes/model_routes.py` — Add version history
- `backend/api/routes/security_routes.py` [NEW] — Security config endpoint
- `backend/api/routes/ws_routes.py` [NEW] — WebSocket ticket
- `backend/api/routes/dashboard_routes.py` [NEW] — Dashboard summary

**Dependencies**: A1 (some data needs persistence), A2 (error contract)  
**Tests**: Test each new endpoint returns correct data  
**Acceptance**: Frontend contract has no missing endpoints  
**Rollback**: Each endpoint is additive — remove independently

---

### A5: Auth Registration Endpoint

**Objective**: Backend registration endpoint to match frontend sign-up flow.

**Files**:
- `backend/api/routes/auth_routes.py` — Add `POST /api/auth/register`

**Dependencies**: A1 (user persistence)  
**Tests**: Test registration creates user, returns token  
**Acceptance**: Frontend sign-up flow completes against real backend  
**Rollback**: Remove endpoint

---

## TRACK B — FRONTEND / UX

### B1: Install Foundation Dependencies

**Objective**: Install core frontend dependencies.

**Packages**:
```
@tanstack/react-query
react-router-dom (v7)
zod
```

**Files**:
- `package.json` — Add dependencies
- `vite.config.ts` — No changes needed

**Dependencies**: None  
**Tests**: `npm run build` succeeds  
**Acceptance**: Dependencies install, no version conflicts, build clean  
**Rollback**: `npm uninstall`

---

### B2: Design System Foundation (shadcn/ui)

**Objective**: Initialize shadcn/ui and create core primitive components.

**Files**:
- `components.json` [NEW] — shadcn/ui configuration
- `src/lib/utils.ts` [NEW] — `cn()` class merge utility
- `src/components/ui/button.tsx` [NEW]
- `src/components/ui/badge.tsx` [NEW]
- `src/components/ui/card.tsx` [NEW]
- `src/components/ui/dialog.tsx` [NEW]
- `src/components/ui/command.tsx` [NEW] — For command palette
- `src/components/ui/table.tsx` [NEW]
- `src/components/ui/tabs.tsx` [NEW]
- `src/components/ui/tooltip.tsx` [NEW]
- `src/components/ui/skeleton.tsx` [NEW]
- `src/components/ui/input.tsx` [NEW]
- `src/components/ui/dropdown-menu.tsx` [NEW]
- `src/components/ui/alert-dialog.tsx` [NEW]
- `src/components/ui/toast.tsx` / `sonner.tsx` [NEW]

**Custom Components**:
- `src/components/data-display/MetricCard.tsx` [NEW] — Replace `KPICard` with design-system version
- `src/components/data-display/StatusBadge.tsx` [NEW] — Unified status → color mapping
- `src/components/data-display/DataTable.tsx` [NEW] — Sortable, filterable, paginated
- `src/components/feedback/EmptyState.tsx` [NEW]
- `src/components/feedback/ErrorState.tsx` [NEW]
- `src/components/feedback/LoadingState.tsx` [NEW]
- `src/components/data-display/TrustIndicator.tsx` [NEW] — Replaces TrustGauge with explainability
- `src/components/data-display/Timeline.tsx` [NEW] — For audit and incident timelines

**Dependencies**: B1 (needs class merge utilities from Tailwind setup)  
**UI Impact**: Foundation for all new UI  
**Tests**: Storybook or Vitest component tests for each primitive  
**Acceptance**: All primitives render correctly in isolation  
**Rollback**: Delete `src/components/ui/` directory

---

### B3: Application Shell and Router

**Objective**: Create persistent application shell with sidebar navigation and route-based content.

**Files**:
- `src/App.tsx` — Replace conditional rendering with `RouterProvider`
- `src/main.tsx` — Add `QueryClientProvider` + `RouterProvider`
- `src/components/layout/AppShell.tsx` [NEW] — Sidebar + top bar + content area
- `src/components/layout/Sidebar.tsx` [NEW] — Navigation with icons, role-aware visibility
- `src/components/layout/TopBar.tsx` [NEW] — System status, user menu, notifications
- `src/components/layout/Breadcrumbs.tsx` [NEW] — Auto-derived from route
- `src/components/layout/PageHeader.tsx` [NEW] — Title + description + actions
- `src/router.tsx` [NEW] — Route definitions

**Routes**:
```
/                    → CommandCenter
/federation          → FederationPage
/trust               → TrustCenter
/trust/:clientId     → TrustDetail
/security            → SecurityOperations
/incidents           → IncidentList
/incidents/:id       → IncidentInvestigation
/models              → ModelCenter
/hospital/:id        → HospitalWorkstation
/audit               → AuditWorkspace
/admin               → Administration
/health              → SystemHealth
/login               → LoginPage
```

**Dependencies**: B1 (react-router), B2 (design system primitives)  
**UI Impact**: URL-based navigation, deep links, browser back button  
**Tests**: Route rendering, breadcrumb derivation, protected route redirect  
**Acceptance**: Every route renders correct component. Deep links work.  
**Rollback**: Revert `App.tsx` to conditional rendering

---

### B4: TanStack Query Integration

**Objective**: Replace all raw `fetch()` calls with TanStack Query hooks.

**Files**:
- `src/hooks/queries/useClients.ts` [NEW]
- `src/hooks/queries/useRounds.ts` [NEW]
- `src/hooks/queries/useIncidents.ts` [NEW]
- `src/hooks/queries/useTrust.ts` [NEW]
- `src/hooks/queries/useModelStatus.ts` [NEW]
- `src/hooks/queries/useAuditLogs.ts` [NEW]
- `src/hooks/queries/useSystemHealth.ts` [NEW]
- `src/hooks/queries/useDashboardSummary.ts` [NEW]
- `src/hooks/mutations/useStartRound.ts` [NEW]
- `src/hooks/mutations/useTrainHospital.ts` [NEW]
- `src/hooks/mutations/useIncidentAction.ts` [NEW]
- `src/hooks/mutations/useClientAction.ts` [NEW]
- `src/hooks/mutations/useModelRollback.ts` [NEW]
- `src/services/api/client.ts` [MODIFY] — Slim down to base request function

**Dependencies**: B1 (@tanstack/react-query), B3 (QueryClientProvider in App)  
**UI Impact**: Automatic loading states, error states, cache invalidation  
**Tests**: Test query hooks with MSW  
**Acceptance**: No raw `fetch()` in any component. All data via TanStack Query.  
**Rollback**: Revert individual component imports

---

### B5: Zustand Refactoring

**Objective**: Strip server data out of Zustand. Keep only UI state.

**Files**:
- `src/store/useFedSentinelStore.ts` — Remove `hospitals`, `federationRounds`, `incidents`. Keep `activePersona`, modals, toasts, `events[]`, preferences.

**What Zustand KEEPS**: `activePersona`, `activeHospitalId`, `selectedIncidentId`, `selectedClientId`, modal open/close states, `toasts[]`, `events[]` (WS ring buffer), `settings`, `isDemoMode`.

**What Zustand LOSES**: `hospitals`, `federationRounds`, `incidents`, `systemStatus.apiStatus`, `strategyComparison`, all `setHospitals/setFederationRounds/setIncidents` setters, `runDemoSequence`.

**Dependencies**: B4 (TanStack Query must be in place first)  
**UI Impact**: None visible — data still available via query hooks  
**Tests**: Verify store only contains UI state  
**Acceptance**: No server-fetched entity in Zustand  
**Rollback**: Re-add server data to store

---

### B6: Auth Layer

**Objective**: Create dedicated authentication state management.

**Files**:
- `src/services/auth/authStore.ts` [NEW] — Token storage, user profile, session management
- `src/services/auth/AuthProvider.tsx` [NEW] — Auth context, login redirect
- `src/pages/LoginPage.tsx` [NEW] — Standalone login page
- `src/hooks/useAuth.ts` [NEW] — Hook for components to check auth state

**Dependencies**: B3 (router for login redirect)  
**UI Impact**: Proper login/logout flow, session expiry handling  
**Tests**: Test token storage, expired token redirect, permission check  
**Acceptance**: Unauthorized user redirected to login. Token attached to all API calls.  
**Rollback**: Revert to demo auto-login

---

### B7: WebSocket Refactoring

**Objective**: Enhance WebSocket with ticket auth and TanStack Query integration.

**Files**:
- `src/services/realtime/wsClient.ts` [MODIFY from `src/api/websocket.ts`] — Add ticket auth, heartbeat
- `src/hooks/useWebSocket.ts` [NEW] — Replaces `useLiveEvents.ts`, integrates with queryClient invalidation

**Dependencies**: A4 (WebSocket ticket endpoint), B4 (TanStack Query for invalidation)  
**UI Impact**: Authenticated real-time events, automatic data refresh on events  
**Tests**: Test connection state transitions, event handling  
**Acceptance**: WS connection requires valid ticket. Stale data auto-refreshes on events.  
**Rollback**: Revert to unauthenticated WS

---

### B8: Feature Pages (Incremental Migration)

**Objective**: Rebuild each page using design system, TanStack Query, and router.

**Order** (dependency-driven):

1. **Command Center** — `src/features/command-center/CommandCenter.tsx`
   - Uses: `useDashboardSummary`, `useClients`, `useRounds`, `useIncidents`
   - Replaces: `SecurityOverview.tsx` (290 lines)
   - Remove: `Math.random()` PCA chart

2. **Incident List + Investigation** — `src/features/incidents/IncidentList.tsx`, `IncidentInvestigation.tsx`
   - Uses: `useIncidents`, `useIncidentAction`
   - Replaces: `IncidentsPage.tsx` (248 lines), `InvestigationPage.tsx` (475 lines)
   - Decompose investigation into tabbed evidence viewer

3. **Trust Center** — `src/features/trust/TrustCenter.tsx`, `TrustDetail.tsx`
   - Uses: `useClients`, `useTrust`
   - Replaces: existing `TrustCenter.tsx`
   - Add: explainability panel (score breakdown, policy version, history)

4. **Hospital Workstation** — `src/features/hospital/HospitalWorkstation.tsx`
   - Uses: `useClients`, `useTrainHospital`, `useTrust`
   - Replaces: existing `HospitalWorkstation.tsx` (677 lines)
   - Decompose into: HospitalIdentity, TrainingForm, TrainingResults, InferenceLab, AppealPanel

5. **Federation** — `src/features/federation/FederationPage.tsx`
   - Uses: `useRounds`, `useStartRound`
   - New page (rounds are currently embedded in overview)

6. **Model Center** — `src/features/models/ModelCenter.tsx`
   - Uses: `useModelStatus`, `useModelRollback`
   - Replaces: existing `ModelCenter.tsx`
   - Add: version lineage visualization

7. **Audit Workspace** — `src/features/audit/AuditWorkspace.tsx`
   - Uses: `useAuditLogs` with pagination + filters
   - New page (audit was previously mixed with Trust Center)

8. **System Health** — `src/features/health/SystemHealth.tsx`
   - Uses: `useSystemHealth`
   - New page

**Dependencies**: B2 (design system), B3 (router), B4 (queries)  
**Tests**: Component tests for each feature  
**Acceptance**: Each page renders with loading → data → empty → error states

---

### B9: Command Palette

**Objective**: Keyboard-accessible command palette for navigation and actions.

**Files**:
- `src/components/layout/CommandPalette.tsx` [NEW] — Uses shadcn/ui `Command` component

**Commands**: Navigate to any route, search clients/incidents/rounds, toggle defense, open model card, verify audit chain.

**Keyboard**: `Ctrl+K` opens palette  
**Dependencies**: B2 (Command component), B3 (router for navigation)  
**Tests**: Test command rendering, keyboard activation, navigation  
**Acceptance**: `Ctrl+K` opens palette. Typing filters commands. Enter navigates.

---

### B10: Context Provider Removal

**Objective**: Delete FedSentinelContext after all components migrated.

**Files**:
- `src/context/FedSentinelContext.tsx` — DELETE
- `src/data/mockData.ts` — DELETE (replaced by demo mode in backend)
- Remove all `useFedSentinelContext()` imports

**Dependencies**: B4, B5, B6, B7, B8 (all must complete first)  
**Acceptance**: `grep -r "FedSentinelContext" src/` returns zero results  
**Rollback**: Restore from git

---

## TRACK C — SECURITY

### C1: RBAC Enforcement

**Objective**: Apply `get_current_user` + `require_roles` to all mutating and sensitive endpoints.

**Files**: All 7 route files in `backend/api/routes/`

**Role Matrix**:

| Endpoint Pattern | Required Roles |
|-----------------|----------------|
| `GET /api/clients` | Any authenticated |
| `POST /api/clients/*/action` | SOC_ANALYST, FEDERATION_ADMIN, SUPER_ADMIN |
| `POST /api/rounds/start` | FEDERATION_ADMIN, SUPER_ADMIN |
| `POST /api/simulation/*` | SOC_ANALYST, FEDERATION_ADMIN |
| `POST /api/model/rollback` | FEDERATION_ADMIN, SUPER_ADMIN |
| `POST /api/incidents/*/action` | SOC_ANALYST, SUPER_ADMIN |
| `GET /api/audit/*` | AUDITOR, SOC_ANALYST, SUPER_ADMIN |

**Dependencies**: A2 (error contract for 401/403 responses)  
**Tests**: Test 401 without token, 403 with wrong role  
**Acceptance**: No mutating endpoint callable without valid JWT  
**Rollback**: Remove `Depends()` decorators

---

### C2: Security Headers and Rate Limiting

**Objective**: Add production security middleware.

**Files**:
- `main.py` — Add `slowapi` rate limiter + security headers middleware
- `backend/core/config.py` — Remove hardcoded JWT_SECRET default, add rate limit config
- `requirements.txt` — Add `slowapi`

**Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `X-XSS-Protection`

**Rate Limits**: `POST /api/auth/login` → 10/minute. Other POST → 30/minute. GET → 60/minute.

**Dependencies**: None  
**Tests**: Test 429 response on rate limit exceeded. Test headers present on response.  
**Acceptance**: All responses include security headers. Rate limiting active.  
**Rollback**: Remove middleware

---

### C3: WebSocket Security

**Objective**: Implement ticket-based WebSocket authentication.

**Files**:
- `backend/api/routes/ws_routes.py` [NEW] — Ticket generation endpoint
- `main.py` — Modify WS handler to validate ticket before upgrading

**Dependencies**: C1 (auth must work first)  
**Tests**: Test WS rejects without ticket, accepts with valid ticket, rejects expired ticket  
**Acceptance**: Unauthenticated WS connections are refused  
**Rollback**: Revert to unauthenticated WS

---

## TRACK D — TESTING

### D1: Vitest Setup

**Objective**: Configure frontend testing infrastructure.

**Files**:
- `vitest.config.ts` [NEW]
- `src/test/setup.ts` [NEW] — RTL setup, MSW handlers
- `package.json` — Add vitest, @testing-library/react, @testing-library/jest-dom, msw

**Dependencies**: B1  
**Acceptance**: `npm run test` executes successfully  
**Rollback**: Remove test config

---

### D2: Component Tests (20 Priority)

**Objective**: Test critical UI components.

**Files**: `src/__tests__/` directory with tests per feature

**Priority tests**: As listed in FRONTEND_ARCHITECTURE.md §Frontend Testing Strategy  
**Dependencies**: D1, B2 (design system components to test)  
**Acceptance**: 20+ tests passing  
**Rollback**: Delete test files

---

### D3: Backend Integration Tests

**Objective**: Test end-to-end workflows through the API.

**Files**:
- `tests/test_round_lifecycle.py` [NEW] — Start round → pipeline → trust update → audit trail
- `tests/test_attack_response.py` [NEW] — Attack → quarantine → incident → reinstate
- `tests/test_persistence.py` [NEW] — Create data → "restart" → data persists

**Dependencies**: A1 (persistence), C1 (auth)  
**Acceptance**: All integration tests pass  
**Rollback**: Delete test files

---

### D4: Playwright E2E

**Objective**: Test critical user journey through real browser.

**Flow**: Login → Command Center → View Clients → Hospital Workstation → Train → Security Verdict → Quarantine → Incident → Investigation → Evidence → Audit → Verify Chain

**Files**:
- `playwright.config.ts` [NEW]
- `e2e/critical-path.spec.ts` [NEW]

**Dependencies**: B3 (router), B8 (all feature pages), C1 (auth)  
**Acceptance**: E2E test passes in headless Chromium  
**Rollback**: Delete e2e directory

---

## TRACK E — OBSERVABILITY

### E1: Real Prometheus Metrics

**Objective**: Replace hardcoded metrics text with actual counters.

**Files**:
- `main.py` — Replace text metrics with `prometheus_client` instrumentation
- `requirements.txt` — Add `prometheus_client`

**Counters**: `requests_total`, `request_duration_seconds`, `rounds_completed`, `incidents_created`, `quarantine_actions`, `ws_connections_active`

**Dependencies**: None  
**Tests**: `GET /metrics` returns parseable Prometheus format  
**Acceptance**: Metrics increment on actual requests/events  
**Rollback**: Revert to text output

---

### E2: Request Logging Middleware

**Objective**: Structured logging for all API requests.

**Files**:
- `backend/middleware/logging.py` [NEW] — Log method, path, status, duration, user_id

**Dependencies**: None  
**Acceptance**: Every request produces a structured log line  
**Rollback**: Remove middleware

---

## TRACK F — DEMO / EXECUTIVE EXPERIENCE

### F1: Deterministic Demo Seed

**Objective**: Create reproducible demo data that exercises all product capabilities.

**Files**:
- `scripts/demo_seed.py` [NEW] — Seed database with 6 hospitals, 5 rounds, 2 incidents, 20 audit events

**Sequence**: 6 hospitals → 3 clean rounds → H3 backdoor attack → quarantine → incident → trust degradation → recovery round → audit verification

**Dependencies**: A1 (persistence)  
**Acceptance**: `python scripts/demo_seed.py` creates identical state every run  
**Rollback**: `POST /api/demo/reset`

---

### F2: System Truth Enforcement

**Objective**: Centralize capability truth labels. Every feature is LIVE, SIMULATED, or ROADMAP.

**Files**:
- `backend/api/routes/system_routes.py` [NEW] — `GET /api/system/capabilities` returns capability manifest
- Frontend truth panel updated to read from backend instead of hardcoded

**Dependencies**: A4 (new endpoint)  
**Acceptance**: Every capability in the UI has a truth label from backend  
**Rollback**: Revert to hardcoded labels

---

### F3: Documentation Completion

**Files**:
- `docs/DEPLOYMENT.md` [NEW]
- `docs/API_REFERENCE.md` [NEW]
- `CHANGELOG.md` [NEW]
- `README.md` [UPDATE]
- `docs/ARCHITECTURE.md` [UPDATE]

**Dependencies**: All other tracks (documents final state)  
**Acceptance**: A new developer can read docs and understand the system

---

## Execution Order

```
PHASE 1: Foundation (Gate G3, G4)
├─ A1: Database Persistence
├─ A2: Error Contract
├─ A3: Pagination
├─ B1: Install Dependencies
├─ B2: Design System
├─ C2: Security Headers
├─ E1: Prometheus Metrics
└─ E2: Request Logging

PHASE 2: Architecture (Gate G5, G6)
├─ A4: Missing Endpoints
├─ A5: Auth Registration
├─ B3: Application Shell + Router
├─ B4: TanStack Query
├─ B5: Zustand Refactoring
├─ B6: Auth Layer
├─ B7: WebSocket Refactoring
├─ C1: RBAC Enforcement
├─ C3: WebSocket Security
└─ D1: Vitest Setup

PHASE 3: Product (Gate G7)
├─ B8: Feature Pages (8 pages, incremental)
├─ B9: Command Palette
├─ D2: Component Tests
├─ D3: Backend Integration Tests
└─ F1: Demo Seed

PHASE 4: Polish (Gate G8, G9, G10)
├─ B10: Context Removal
├─ D4: Playwright E2E
├─ F2: System Truth
├─ F3: Documentation
└─ Performance audit + code splitting
```

---

## Updated Tool Decision Matrix

| Tool | Decision | Phase | Justification |
|------|----------|-------|---------------|
| **shadcn/ui** | ADOPT | Phase 1 | Source-owned accessible components on Radix primitives |
| **@tanstack/react-query** | ADOPT | Phase 1 | Resolves dual-state architecture contradiction |
| **react-router-dom v7** | ADOPT | Phase 1 | URL routing, deep links, browser history |
| **Zod** | ADOPT | Phase 1 | Runtime validation at API boundary |
| **Vitest** | ADOPT | Phase 2 | Frontend unit/component testing |
| **@testing-library/react** | ADOPT | Phase 2 | Component testing with RTL |
| **slowapi** | ADOPT | Phase 1 | Rate limiting for FastAPI |
| **prometheus_client** | ADOPT | Phase 1 | Real metrics instrumentation |
| **Playwright** | ADOPT | Phase 3 | E2E testing |
| **Storybook** | DEFER | — | Evaluate after design system is stable. Not blocking. |
| **React Hook Form** | DEFER | — | Only adopt if training config form complexity justifies it |
| **MSW** | ADOPT | Phase 2 | API mocking for frontend tests |
| **Alembic** | ADOPT | Phase 1 | Database migrations |
| **PyJWT** | ADOPT | Phase 1 | Replace hand-rolled JWT |
| MLflow | SKIP (for now) | — | Lightweight in-app versioning is sufficient |
| Flower | SKIP | — | Core coordinator IS the product |
| Keycloak | SKIP | — | PyJWT + RBAC sufficient for demo |
| OPA | SKIP | — | Fix existing RBAC first |
| Ollama/LiteLLM | SKIP | — | Platform not stable enough for AI layer |

---

---

## TRACK G — HUMAN-CENTERED CONTROL PLANE TRANSFORMATION

### G1: Free-Rider Elimination & Trust Decomposition
- **Objective**: Fix correctness flaw where ineffective/zero updates receive high trust.
- **Formulation**: Disentangle Security Cleanliness ($S_{sec}$), Contribution Integrity ($S_{contrib}$), Participation Reliability ($S_{rel}$), and Model Gain ($S_{perf}$).
- **Enforcement**: Free-rider update ($\rho_{norm} < 0.05$) triggers severe contribution penalty, docks composite trust $< 50\%$, and assigns $0.0000$ aggregation weight.

### G2: Multi-Step Round Creation & Preflight Gate
- **Objective**: Replace simple modal with full 6-phase round creation wizard.
- **Endpoint**: `POST /api/rounds/preflight` returns `READY` | `WARNING` | `BLOCKED` with quorum validation and remediation advice.
- **Action-Consequence Mapping**: Explicit impact preview modal before round dispatch.

### G3: Asynchronous Hospital Enclave Training Job Runner
- **Objective**: Transform synchronous enclave execution into real asynchronous job runner with live timeline.
- **Endpoints**: `POST /api/training/jobs` and `GET /api/training/jobs/{job_id}`.
- **Lifecycle**: `QUEUED` -> `INITIALIZING` -> `TRAINING` (epoch loss progress) -> `VALIDATING` -> `SECURITY_SCAN` -> `COMPLETED`.

### G4: Verifiable Model Experiment Provenance Registry
- **Objective**: Ground all benchmark numbers in verifiable experiment runs with seeds, parameters, and checksums.
- **Invariant**: Any unmeasured combination explicitly displays `NOT MEASURED`.

### G5: Deep Node Readiness & TEE Attestation
- **Objective**: Detailed health inspection covering Intel SGX / AMD SEV-SNP attestation, PCR measurements, dataset class distribution, and network SLA (`GET /api/clients/{client_id}/readiness`).

---

## Quality Standard

After implementation, each persona must be able to complete their primary workflow without confusion:

- ✅ **SOC Analyst**: Login → See threats → Investigate incident → View L0-L5 evidence → Quarantine → Verify audit
- ✅ **Hospital Engineer**: Select hospital → Configure training → Execute → See verdict → Understand trust score → File appeal
- ✅ **Federation Admin**: Start round → Monitor progress → Compare strategies → Toggle defense → Review model
- ✅ **Executive**: See system status → Understand what's real → View security posture → Know what happened
- ✅ **Auditor**: Search events → Verify hash chain → Export evidence → Trace actor actions

> [!IMPORTANT]
> **Production Testing Standard**: All 24+ pytest invariants and full TypeScript/Vite frontend builds must remain green at every commit.

