# FedSentinel-Health Frontend Architecture

> **Decision Date**: 2026-09-16  
> **Status**: APPROVED  
> **Replaces**: Implicit dual-state architecture (Zustand + Context)

---

## Architectural Contradiction Resolved

The prior plan contained conflicting directives:
1. "Zustand owns all API operations"
2. "TanStack Query replaces Context fetching"

These cannot coexist without duplication. This document resolves the contradiction with an explicit ownership model.

---

## State Ownership Model

```
┌──────────────────────────────────────────────────────────┐
│                     State Ownership                       │
├──────────────┬───────────────────────────────────────────┤
│ SERVER STATE │ @tanstack/react-query                     │
│              │ · clients, rounds, incidents, audit       │
│              │ · model status, trust, system health      │
│              │ · Uses query caching + stale-while-reval. │
│              │ · Mutations with automatic invalidation   │
├──────────────┼───────────────────────────────────────────┤
│ UI STATE     │ Zustand (useFedSentinelStore)             │
│              │ · activePersona, selectedHospitalId       │
│              │ · modals (open/close state)               │
│              │ · toasts queue                            │
│              │ · UI preferences (theme, density)         │
│              │ · command palette state                   │
├──────────────┼───────────────────────────────────────────┤
│ AUTH STATE   │ Dedicated auth module                     │
│              │ · JWT access token (memory)               │
│              │ · Current user profile                    │
│              │ · Session persistence (localStorage)      │
│              │ · Token refresh logic                     │
│              │ · Auth header injection for queries       │
├──────────────┼───────────────────────────────────────────┤
│ REALTIME     │ Dedicated WebSocket layer                 │
│              │ · Connection lifecycle                    │
│              │ · Event deduplication                     │
│              │ · Reconnect with backoff                  │
│              │ · Integrates with TanStack Query          │
│              │   invalidation on relevant events         │
│              │ · Writes events to Zustand ring buffer    │
├──────────────┼───────────────────────────────────────────┤
│ URL STATE    │ React Router / TanStack Router            │
│              │ · Route parameters (:clientId, :incId)    │
│              │ · Search params (filters, pagination)     │
│              │ · Breadcrumb derivation                   │
├──────────────┼───────────────────────────────────────────┤
│ FORM STATE   │ React local state                        │
│              │ · Training config form                    │
│              │ · Login/registration form                 │
│              │ · Client creation form                    │
│              │ · React Hook Form only for complex forms  │
├──────────────┼───────────────────────────────────────────┤
│ VALIDATION   │ Zod schemas                              │
│              │ · API response validation at boundary     │
│              │ · Form input validation                   │
│              │ · Type inference from Zod to TypeScript   │
├──────────────┴───────────────────────────────────────────┤
│ COMPONENT    │ React useState / useReducer               │
│ LOCAL STATE  │ · Accordion open/close                    │
│              │ · Tab selection within a component        │
│              │ · Hover/focus state                       │
│              │ · Local loading for component actions     │
└──────────────┴───────────────────────────────────────────┘
```

---

## The Rule

> **Server data lives in TanStack Query. UI state lives in Zustand. Never duplicate server data in Zustand.**

The ONLY exception: the WebSocket event ring buffer (`events[]`) lives in Zustand because it is an append-only client-side stream, not a server-fetched collection.

---

## Migration Strategy for FedSentinelContext

`FedSentinelContext.tsx` (769 lines) will be **incrementally deprecated**, not deleted in one pass.

### Phase 1: Stop adding to it
No new features use FedSentinelContext. New features use TanStack Query + Zustand.

### Phase 2: Extract API operations
Move all `apiClient.*` calls into TanStack Query hooks:
```
src/hooks/queries/useClients.ts     → queryKey: ['clients']
src/hooks/queries/useRounds.ts      → queryKey: ['rounds']  
src/hooks/queries/useIncidents.ts   → queryKey: ['incidents']
src/hooks/queries/useTrust.ts       → queryKey: ['trust', clientId]
src/hooks/queries/useModelStatus.ts → queryKey: ['model', 'status']
src/hooks/queries/useAuditLogs.ts   → queryKey: ['audit', 'logs']
src/hooks/queries/useSystemHealth.ts→ queryKey: ['system', 'health']
```

### Phase 3: Migrate components
One component at a time, replace `useFedSentinelContext()` with the equivalent TanStack Query hook. Components that only read data can migrate first.

### Phase 4: Remove Context provider
When no component imports `useFedSentinelContext()`, remove the provider from `App.tsx` and delete the file.

---

## WebSocket ↔ TanStack Query Integration

When a WebSocket event arrives that invalidates server data, call `queryClient.invalidateQueries()`:

```typescript
// In WebSocket event handler
switch (event.event_type) {
  case 'ROUND_COMPLETED':
    queryClient.invalidateQueries({ queryKey: ['rounds'] });
    queryClient.invalidateQueries({ queryKey: ['model'] });
    break;
  case 'CLIENT_QUARANTINED':
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
    break;
  case 'INCIDENT_CREATED':
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
    break;
}
```

This ensures the UI updates automatically when backend state changes, without manual `setState` calls.

---

## WebSocket Authentication Decision

### Problem
The prior plan proposed bearer tokens in WebSocket query strings: `wss://host/ws?token=eyJhbG...`

This leaks credentials into:
- Browser history
- Server access logs
- Proxy logs
- Referrer headers
- Error reporting

### Decision: Short-Lived Connection Ticket

```
Client                     Backend
  │                          │
  ├─ POST /api/ws/ticket ──→│  (authenticated with JWT)
  │                          │  Generate short-lived ticket (60s TTL, single-use)
  │←── { ticket: "abc..." } ─┤
  │                          │
  ├─ WS /ws/events?t=abc ──→│  (validate ticket, consume it, upgrade to WS)
  │                          │  Ticket is NOT a long-lived credential
  │←── Connection accepted ──┤
```

**Benefits**:
- Ticket is single-use, expires in 60 seconds
- Even if logged, cannot be replayed
- Does not expose the JWT
- Standard pattern used by Slack, Discord, GitHub Copilot

---

## Routing Architecture

Adopt **React Router v7** (the existing dependency ecosystem is React 19 compatible).

```typescript
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <CommandCenter /> },
      { path: 'federation', element: <FederationPage /> },
      { path: 'trust', element: <TrustCenter /> },
      { path: 'trust/:clientId', element: <TrustDetail /> },
      { path: 'security', element: <SecurityOperations /> },
      { path: 'incidents', element: <IncidentList /> },
      { path: 'incidents/:incidentId', element: <IncidentInvestigation /> },
      { path: 'models', element: <ModelCenter /> },
      { path: 'hospital/:hospitalId', element: <HospitalWorkstation /> },
      { path: 'audit', element: <AuditWorkspace /> },
      { path: 'admin', element: <Administration /> },
      { path: 'health', element: <SystemHealth /> },
    ],
  },
]);
```

---

## Component Library Decision

### Decision: Adopt shadcn/ui

**Rationale**:
1. Source-code ownership — components are copied into the project, not imported from node_modules
2. Built on Radix primitives — accessible by default (keyboard, screen reader, focus management)
3. Tailwind-native — aligns with existing Tailwind v4 setup
4. No runtime dependency — tree-shakes perfectly
5. Can customize to FedSentinel's dark security-operations visual language

**What to install** (only what's needed):
- Button, Badge, Card
- Dialog, AlertDialog, Drawer, Sheet
- DropdownMenu, Command (for command palette)
- Table, Tabs, Tooltip
- Input, Select, Label
- Toast (Sonner)
- Skeleton
- Separator, ScrollArea

**What NOT to install**: Calendar, DatePicker, Carousel, Slider, Accordion (unless actually needed).

### Component Organization
```
src/
  components/
    ui/              ← shadcn/ui primitives (Button, Badge, Card, Dialog, etc.)
    layout/          ← AppShell, Sidebar, Breadcrumbs, PageHeader
    data-display/    ← DataTable, MetricCard, StatusBadge, Timeline, TrustGauge
    feedback/        ← Toast, EmptyState, ErrorState, LoadingState, Skeleton
    forms/           ← TrainingConfigForm, ClientRegistrationForm
    features/        ← Feature-specific composed components
      command-center/
      federation/
      trust/
      security/
      incidents/
      models/
      hospital/
      audit/
      admin/
```

---

## Design Tokens

Extend the existing `@theme` block in `index.css`:

```css
@theme {
  /* Existing tokens preserved */
  --color-slate-850: #151f32;
  --color-slate-900: #0f172a;
  --color-slate-950: #020617;

  /* Status — consistent across the app */
  --color-status-healthy: var(--color-emerald-500);
  --color-status-warning: var(--color-amber-500);
  --color-status-critical: var(--color-rose-500);
  --color-status-info: var(--color-cyan-500);
  --color-status-unknown: var(--color-slate-500);

  /* Surfaces */
  --color-surface-primary: var(--color-slate-900);
  --color-surface-secondary: var(--color-slate-850);
  --color-surface-elevated: var(--color-slate-800);

  /* Spacing scale */
  --spacing-page: 1.5rem;
  --spacing-section: 1rem;
  --spacing-card: 0.75rem;

  /* Radius */
  --radius-card: 0.5rem;
  --radius-button: 0.375rem;
  --radius-badge: 9999px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-elevated: 0 4px 12px rgba(0,0,0,0.4);
}
```

---

## API Client Architecture

```
src/
  services/
    api/
      client.ts        ← Base fetch wrapper with auth header, error handling
      types.ts         ← Generated or hand-written API response types  
      endpoints.ts     ← Endpoint URL constants
    auth/
      authStore.ts     ← JWT token storage, refresh, session
      authProvider.tsx  ← Auth context for login redirect
    realtime/
      wsClient.ts      ← WebSocket client (keep existing, enhance)
      useWebSocket.ts  ← React hook with query invalidation
```

### API Client Contract
```typescript
// Every API call goes through this
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = authStore.getAccessToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.detail || 'Unknown error', error);
  }
  
  return response.json();
}
```

---

## Frontend Testing Strategy

### Framework: Vitest + React Testing Library + Playwright

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Utility functions, Zod schemas, computed values |
| Component | Vitest + RTL | Rendering, interactions, state transitions |
| Integration | Vitest + MSW | API query/mutation flows with mocked server |
| E2E | Playwright | Critical user journeys across real browser |

### Priority Tests (First 20)
1. Trust score display maps to correct color/label
2. Status badge renders correct variant
3. Metric card shows value and trend
4. Data table sorts, paginates, filters
5. Empty state renders when no data
6. Error state renders on API failure
7. Auth redirect on 401
8. WebSocket reconnection state display
9. Command palette opens with `Ctrl+K`
10. Incident list renders with correct severity
11. Training form validates required fields
12. Quarantine confirmation dialog blocks without approval
13. Audit chain verification displays result
14. Model card renders all sections
15. Hospital selector changes context
16. Toast appears on action completion
17. Role-aware navigation hides unauthorized routes
18. Loading skeleton appears during data fetch
19. Breadcrumb reflects current route
20. Deep link to incident works

---

## Performance Strategy

| Technique | Where |
|-----------|-------|
| Route-based code splitting | `React.lazy()` for each route |
| Query caching | TanStack Query `staleTime: 30_000` for read-mostly data |
| Virtual scrolling | Audit log table (potentially thousands of rows) |
| Debounced search | Global search, data table filters |
| `memo` + `useMemo` | Expensive chart data computations |
| Bundle analysis | Run `vite-bundle-analyzer` to find optimization targets |

---

## API Contract Generation

### Decision: Hand-Written Types (For Now)

**Why not auto-generate from OpenAPI?**
1. FastAPI's OpenAPI output includes Pydantic validation errors, default values, and metadata that bloats generated types
2. The API surface is ~35 endpoints — manageable by hand
3. Auto-generation adds a build step dependency

**Revisit when**: API surface exceeds 80 endpoints or multiple frontend clients consume it.

**Mitigation**: Use Zod schemas as the runtime validation boundary. If backend shape changes, Zod parse fails with a clear error instead of a silent data corruption.
