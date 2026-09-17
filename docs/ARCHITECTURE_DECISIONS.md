# FedSentinel-Health Architecture Decision Records

> **Date**: 2026-09-16  
> **Format**: Lightweight ADR (Architecture Decision Record)

---

## ADR-001: Modular Monolith Over Microservices

**Status**: ACCEPTED  
**Date**: 2026-09-16  

### Context
The enterprise directive explicitly prohibits "microservice theater." FedSentinel-Health is a single-product platform with tightly coupled domain concepts (federation rounds reference clients, incidents reference rounds, trust scores span clients and rounds).

### Decision
Maintain a **modular monolith** architecture:
- Single FastAPI process with domain-separated router modules
- In-process `FederationCoordinator` for real-time PyTorch operations
- Shared SQLite/PostgreSQL database with domain-scoped tables
- Domain modules communicate via function calls, not HTTP/gRPC

### Consequences
- ✅ Simpler deployment (single process)
- ✅ No network latency between domains
- ✅ Transaction consistency without distributed transactions
- ❌ Cannot scale federation compute independently
- ❌ Single process failure takes down entire system

### Migration Path
If scaling requires it: extract `FederationCoordinator` into a separate worker process communicating via Redis/RabbitMQ task queue. This is a natural seam.

---

## ADR-002: StateService Singleton as Authoritative State

**Status**: ACCEPTED (with planned evolution)  
**Date**: 2026-09-16  

### Context
The application uses an in-memory `StateService` singleton as the sole source of truth. 15 SQLAlchemy ORM models exist but are completely disconnected from runtime.

### Decision
Keep `StateService` as the runtime authority but **add database persistence**:
1. Wire ORM models to `StateService` CRUD operations
2. Load initial state from database on startup
3. Persist mutations to database on write
4. Keep in-memory cache for read performance
5. Add Alembic for schema migrations

### Consequences
- ✅ State survives server restart
- ✅ Audit log becomes permanent
- ✅ Reuses existing 15-table ORM schema
- ❌ Slight write latency for persistence
- ❌ Need migration strategy for existing demo data

---

## ADR-003: Hand-Rolled JWT → PyJWT Library

**Status**: PROPOSED  
**Date**: 2026-09-16  

### Context
Authentication uses a custom HMAC-SHA256 JWT implementation (`backend/core/auth.py`). While functional, it lacks:
- Standard JWT `kid` (key ID) header
- Key rotation support
- `aud`/`iss` claims
- Standard error messages that security tools expect

### Decision
Replace custom JWT implementation with `PyJWT` library while preserving:
- Same RBAC role system (7 roles)
- Same `UserContext` Pydantic model
- Demo mode bypass behavior
- PBKDF2-HMAC-SHA256 password hashing (keep)

### Consequences
- ✅ Standard JWT that any IdP can validate
- ✅ Built-in expiry, audience, issuer validation
- ✅ Foundation for future Keycloak/OIDC integration
- ❌ Existing tokens become invalid (acceptable — demo tokens)

---

## ADR-004: Zustand as Single Frontend State Authority

**Status**: PROPOSED  
**Date**: 2026-09-16  

### Context
The frontend has dual state management:
1. **Zustand store** (`useFedSentinelStore.ts`, 220 lines) — reactive global state
2. **React Context** (`FedSentinelContext.tsx`, 769 lines) — API calls + auth + local state + mock fallback

This creates ambiguity about which is authoritative and duplicates data fetching logic.

### Decision
1. Consolidate on **Zustand** as the single state authority
2. Move API call logic into standalone service modules (`src/services/`)
3. Move auth logic into a dedicated Zustand auth slice
4. Extract mock/fallback data into a Zustand middleware
5. **Deprecate** `FedSentinelContext.tsx` — do not delete immediately, migrate incrementally

### Consequences
- ✅ Single source of truth for all frontend state
- ✅ Zustand slices are testable without React rendering
- ✅ Reduces component re-renders (Context changes trigger tree re-renders)
- ❌ Migration requires touching many components
- ❌ Risk of breaking existing working flows during migration

---

## ADR-005: SQLite for Demo, PostgreSQL-Ready for Production

**Status**: PROPOSED  
**Date**: 2026-09-16  

### Context
`DATABASE_URL` defaults to `sqlite:///./fedsentinel.db`. Enterprise customers expect PostgreSQL.

### Decision
- Keep SQLite as default for local development and demo
- Ensure all ORM queries are PostgreSQL-compatible (no SQLite-specific SQL)
- Add a configuration guide for switching `DATABASE_URL` to PostgreSQL
- Test with both backends

### Consequences
- ✅ Zero-config local development
- ✅ Production-ready with single env var change
- ❌ Some SQLite limitations (concurrent writes, JSON operators)

---

## ADR-006: Differential Privacy as Opt-In Feature

**Status**: ACCEPTED  
**Date**: 2026-09-16  

### Context
DP code exists in `aggregator.py` with Gaussian noise mechanism. Config has `DP_ENABLED=False`.

### Decision
Keep DP as an opt-in feature flag:
- Default disabled for demo clarity (clean accuracy numbers)
- Enable via `DP_ENABLED=True` in `.env`
- Add epsilon/delta tracking to round metadata
- Add DP status to SystemTruthPanel

### Consequences
- ✅ Clean demo by default
- ✅ Enterprise customers can enable with formal privacy guarantees
- ❌ DP parameters need tuning guidance

---

## ADR-007: No Kubernetes / Docker for MVP Demo

**Status**: ACCEPTED  
**Date**: 2026-09-16  

### Context
The enterprise directive emphasizes "no microservice theater." Containerization adds deployment complexity without functional benefit for a demo.

### Decision
- Provide `start.bat` and future `start.sh` for direct process execution
- Document Docker deployment as a ROADMAP item
- Add `Dockerfile` only when production deployment planning begins

### Consequences
- ✅ Zero-config demo setup
- ✅ No Docker dependency on reviewer machines
- ❌ Not production-deployable without additional work

---

## ADR-008: WebSocket for Real-Time Events, REST for CRUD

**Status**: ACCEPTED  
**Date**: 2026-09-16  

### Context
The application uses WebSocket for live event streaming (round progress, quarantine events, trust changes) and REST for CRUD operations.

### Decision
Maintain this hybrid approach:
- WebSocket: unidirectional server→client event push for live telemetry
- REST: standard CRUD for all data operations
- Add WebSocket authentication (bearer token in initial connection)
- Add heartbeat/ping-pong for connection health

### Consequences
- ✅ Real-time UX without polling
- ✅ REST for tooling compatibility (cURL, Postman, OpenAPI)
- ❌ WebSocket reconnection needs robustness improvement
