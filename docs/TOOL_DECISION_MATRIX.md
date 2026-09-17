# FedSentinel-Health Tool Decision Matrix

> **Date**: 2026-09-16  
> **Purpose**: Evaluate each candidate tool against actual gaps identified in `ENTERPRISE_GAP_AUDIT.md`

---

## Decision Framework

| Score | Meaning |
|:-----:|---------|
| **5** | Critical — addresses a 🔴 gap, no alternative |
| **4** | High — addresses a 🟠 gap, strong ROI |
| **3** | Medium — improves credibility, moderate effort |
| **2** | Low — nice-to-have, not urgent |
| **1** | Skip — not justified for current scope |

---

## Backend & Infrastructure Tools

### 1. Alembic (Database Migrations)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 5 | Database is UNUSED — need to wire ORM models to runtime state |
| Complexity | Low | Python-native, SQLAlchemy integration |
| Dependency weight | Minimal | Already using SQLAlchemy |
| **Verdict** | **ADOPT** | Required to connect the 15 existing ORM models to actual persistence |

### 2. MLflow (Model Registry & Experiment Tracking)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 3 | No model registry, no experiment tracking, no model versioning |
| Complexity | Medium | Requires server process, S3/local artifact store |
| Dependency weight | Heavy | Java dependency, separate server, MLflow UI |
| **Verdict** | **DEFER** | Implement lightweight model versioning in-app first. Add MLflow only if multiple model families needed |

### 3. Flower (Federated Learning Framework)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 2 | Our custom coordinator already works. Flower would replace core IP |
| Complexity | High | Would require rewriting the entire federation lifecycle |
| Dependency weight | Heavy | Replaces core architecture |
| **Verdict** | **SKIP** | FedSentinel's custom coordinator IS the product differentiator. Flower is for generic FL |

### 4. OpenTelemetry (Distributed Tracing)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 3 | No tracing. Important for enterprise observability narrative |
| Complexity | Low | `opentelemetry-instrumentation-fastapi` auto-instruments |
| Dependency weight | Light | Single pip install, no external collector required for demo |
| **Verdict** | **ADOPT (Phase 2)** | Add after core persistence gaps are fixed |

### 5. Prometheus Client (Python metrics)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 3 | Current `/metrics` endpoint is hardcoded text. Need real counters/gauges |
| Complexity | Low | `prometheus_client` is simple |
| Dependency weight | Light | Single library |
| **Verdict** | **ADOPT (Phase 2)** | Replace hardcoded metrics with real Prometheus counters |

### 6. Grafana
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 2 | Nice for monitoring dashboards but adds operational complexity |
| Complexity | Medium | Requires Docker or standalone install |
| Dependency weight | Medium | Separate service |
| **Verdict** | **DEFER** | Show Prometheus metrics endpoint only. Grafana is infra concern |

### 7. OPA (Open Policy Agent)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 2 | RBAC already defined. OPA adds policy-as-code but high complexity |
| Complexity | High | Rego policy language, sidecar deployment |
| Dependency weight | Heavy | Go binary, sidecar pattern |
| **Verdict** | **SKIP** | Fix existing RBAC enforcement first. OPA is overkill for current scale |

### 8. Keycloak (Identity Provider)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 3 | Would solve JWT hand-rolling, SSO, and key rotation |
| Complexity | High | Java server, Docker required, OIDC config |
| Dependency weight | Very Heavy | Separate JVM process |
| **Verdict** | **DEFER** | Replace hand-rolled JWT with PyJWT library first. Keycloak is for production multi-tenant |

### 9. MinIO (Object Storage)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 2 | Model checkpoints currently stored as local `.pt` files |
| Complexity | Medium | Docker-based S3-compatible storage |
| Dependency weight | Medium | Separate service |
| **Verdict** | **SKIP** | Local filesystem is adequate for demo. MinIO needed only for multi-node production |

### 10. Evidently (ML Monitoring & Data Drift)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 3 | `/api/drift` currently returns hardcoded values |
| Complexity | Medium | Python library, needs pandas/numpy |
| Dependency weight | Medium | Several ML dependencies |
| **Verdict** | **ADOPT (Phase 3)** | Wire real drift monitoring after persistence and auth are solid |

### 11. OWASP ZAP (Security Testing)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 3 | No security testing automation |
| Complexity | Low | CLI-based scan against running API |
| Dependency weight | External tool | Not a pip dependency |
| **Verdict** | **ADOPT (Phase 3)** | Run ZAP baseline scan as part of verification |

### 12. Trivy (Vulnerability Scanning)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 2 | No dependency vulnerability scanning |
| Complexity | Low | Single binary |
| Dependency weight | External tool | CLI only |
| **Verdict** | **ADOPT (Phase 3)** | Add to security verification script |

### 13. Syft (SBOM Generation)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 2 | No SBOM. Required for supply chain compliance narrative |
| Complexity | Low | Single binary |
| Dependency weight | External tool | CLI only |
| **Verdict** | **DEFER** | Nice for compliance docs but not critical for demo |

### 14. Ollama / LiteLLM / Langfuse (AI Assistant)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 2 | No AI assistant or natural-language query |
| Complexity | High | 3 additional services to manage |
| Dependency weight | Very Heavy | Multiple processes, GPU concerns |
| **Verdict** | **DEFER** | Focus on core platform first. AI assistant is Phase 4+ |

---

## Frontend Tools

### 15. TanStack Query (React Query)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 4 | Would fix cache invalidation, loading states, refetch logic. Replace Context API fetching |
| Complexity | Low | Well-known library |
| Dependency weight | Light | Single npm package |
| **Verdict** | **ADOPT (Phase 2)** | Replace FedSentinelContext API fetching with React Query |

### 16. Zod (Schema Validation)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 3 | Runtime type safety for API responses. Catches backend schema mismatches |
| Complexity | Low | Pairs well with TypeScript |
| Dependency weight | Light | Single package |
| **Verdict** | **ADOPT (Phase 2)** | Add alongside TanStack Query |

### 17. Vitest (Unit Testing)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 4 | 43 TSX files with ZERO test coverage |
| Complexity | Low | Vite-native, fast |
| Dependency weight | Light | Dev dependency |
| **Verdict** | **ADOPT (Phase 2)** | Critical for frontend quality |

### 18. Playwright (E2E Testing)
| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Gap addressed | 3 | No E2E tests. Important for demo confidence |
| Complexity | Medium | Requires browser binaries |
| Dependency weight | Medium | Dev dependency + browsers |
| **Verdict** | **ADOPT (Phase 3)** | After Vitest unit tests are in place |

---

## Adoption Roadmap Summary

| Phase | Tools | Rationale |
|-------|-------|-----------|
| **Phase 1 (Now)** | Alembic, PyJWT | Fix critical gaps: persistence + auth |
| **Phase 2 (Core)** | OpenTelemetry, Prometheus, TanStack Query, Zod, Vitest | Observability + frontend quality |
| **Phase 3 (Harden)** | Evidently, OWASP ZAP, Trivy, Playwright | Security + monitoring + E2E |
| **Phase 4+ (Scale)** | MLflow, Keycloak, Grafana, Ollama/LiteLLM/Langfuse | Enterprise scale features |
| **Skip** | Flower, OPA, MinIO, Syft | Not justified for current scope |
