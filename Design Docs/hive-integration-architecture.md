# Integration Architecture
## Driver Check In Admin Module — The Hive (Schreiber Foods)
**Document Version:** 1.0.0
**Baseline Reference:** kb-L3-driver-checkin-baseline v0.1.0
**Status:** Greenfield — all sections authored for Sprint 1–4 scope

---

## IA1: Integration Context Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     HIVE APPLICATION PLATFORM                            │
│                                                                          │
│  ┌─────────────┐          ┌──────────────────────────────────────────┐  │
│  │  React SPA  │          │          FastAPI Backend                  │  │
│  │  (Browser)  │◄──REST──►│                                          │  │
│  └─────────────┘          │  ┌──────────────┐  ┌──────────────────┐  │  │
│                            │  │ Auth Service │  │ Settings Service │  │  │
│  ┌─────────────┐           │  └──────┬───────┘  └────────┬─────────┘  │  │
│  │ Driver App  │◄──REST──► │         │                   │            │  │
│  │  (Mobile)   │  (RO JWT) │  ┌──────▼───────┐  ┌───────▼──────────┐ │  │
│  └─────────────┘           │  │  QR Service  │  │   Audit Service  │ │  │
│                            │  └──────────────┘  └──────────────────┘ │  │
│                            └────┬─────────┬────────────┬─────────────┘  │
│                                 │         │            │                 │
│                    SQLAlchemy   │  Redis  │  qrcode +  │                 │
│                    + oracledb   │  client │  ReportLab │                 │
│                                 ▼         ▼            ▼                 │
│                          ┌──────────┐ ┌──────┐ ┌────────────────┐      │
│                          │Oracle 19c│ │Redis │ │ QR/PDF Library │      │
│                          │HIVE_CORE │ │  7.x │ │ (in-process)   │      │
│                          │HIVE_CHKN │ │      │ └────────────────┘      │
│                          └──────────┘ └──────┘                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## IA2: Integration Inventory

| ID | Integration | Direction | Protocol | Auth Method | Data Exchanged | Sprint | Status |
|----|------------|-----------|----------|-------------|----------------|--------|--------|
| INT-01 | Oracle 19c (HIVE_CORE) | Outbound (R/W) | SQLAlchemy / oracledb (TCP) | DB service account credentials (vault-managed) | Users, Organizations, UserOrganizations | 1 | 🔨 |
| INT-02 | Oracle 19c (HIVE_CHECKIN) | Outbound (R/W) | SQLAlchemy / oracledb (TCP) | DB service account credentials (vault-managed) | DriverCheckinSettings, AuditLogs | 2–4 | 📋 |
| INT-03 | Redis (Session Cache) | Outbound (R/W) | Redis protocol (TCP, TLS) | Redis AUTH token | JWT jti → session reference; JWT blocklist entries | 1 | 🔨 |
| INT-04 | Python qrcode (in-process) | In-process | Function call | N/A | org_url string → PNG bytes | 3 | 📋 |
| INT-05 | ReportLab / WeasyPrint (in-process) | In-process | Function call | N/A | PNG bytes + metadata → PDF bytes | 3 | 📋 |
| INT-06 | Driver Mobile App | Inbound (Read) | HTTPS REST | Short-lived mobile JWT (read-only audience) | DriverCheckinSettings (toggle + value, filtered) | 4 | 📋 |

---

## IA3: Per-Integration Specification

### INT-01 / INT-02 — Oracle 19c Database

| Attribute | Detail |
|-----------|--------|
| Protocol | TCP via oracledb thin mode; connection pooled via SQLAlchemy AsyncEngine |
| Auth | Service account credentials stored in Kubernetes Secret (sourced from Vault); never hardcoded |
| Connection pool | Min: 5, Max: 20; pre-ping enabled; pool_recycle: 3600s |
| Data exchanged | Full CRUD on all tables in HIVE_CORE (INT-01) and HIVE_CHECKIN (INT-02) |
| TLS | Oracle Native Network Encryption or TLS listener; enforced in connection string |
| SLA dependency | Oracle must be available for all write operations; Redis cache can serve auth reads transiently |
| Error handling | SQLAlchemy `OperationalError` → 503 with retry suggestion; `IntegrityError` → 409 Conflict; connection pool exhaustion → 503 |
| Retry policy | See IA5 |
| Circuit breaker | See IA4 |
| Migrations | Alembic additive-only; applied at deploy time before pod rollout |

### INT-03 — Redis Session Cache

| Attribute | Detail |
|-----------|--------|
| Protocol | Redis protocol over TLS (port 6380) |
| Auth | Redis AUTH password stored in Kubernetes Secret |
| Data exchanged | SET jti→session_data (TTL = token expiry); GET jti on each request; SET jti to blocklist on logout |
| Serialization | JSON |
| SLA dependency | Soft dependency — auth middleware degrades gracefully: on Redis unavailability, falls back to DB session lookup (with performance impact; logged as warning) |
| Error handling | `ConnectionError` / `TimeoutError` → fallback to DB session; alert raised; never hard fail |
| Retry policy | 2 retries with 50ms linear backoff; total timeout 200ms before fallback |
| Circuit breaker | See IA4 |

### INT-04 — Python qrcode Library (In-Process)

| Attribute | Detail |
|-----------|--------|
| Type | In-process library call; no network hop |
| Input | Org-specific check-in URL string |
| Output | PNG bytes (in-memory BytesIO) |
| Error handling | Invalid input URL → 422 Unprocessable Entity; library exception → 500 with structured error log |
| No circuit breaker required | In-process; failure is immediate exception; no partial failure state |
| Performance | CPU-bound; expected < 100ms per generation; acceptable at projected call volume |

### INT-05 — ReportLab / WeasyPrint (In-Process)

| Attribute | Detail |
|-----------|--------|
| Type | In-process library call; no network hop |
| Input | QR PNG bytes + org title + layout template |
| Output | PDF bytes streamed to client as `application/pdf` with `Content-Disposition: attachment` |
| Error handling | Library exception → 500 with structured error log; client receives error toast |
| No circuit breaker required | In-process |
| Decision note | Final choice between ReportLab (pure Python) and WeasyPrint (HTML→PDF) deferred to Sprint 3 technical spike based on template complexity |

### INT-06 — Driver Mobile App (Inbound REST)

| Attribute | Detail |
|-----------|--------|
| Protocol | HTTPS REST; endpoint: GET /api/v1/driver-checkin/settings/mobile |
| Auth | Short-lived JWT with `aud=mobile` claim; issued via a separate mobile token endpoint (Sprint 4) |
| Data exchanged | Response: filtered settings array `[{ setting_name, toggle_state, input_value }]`; admin-only fields stripped |
| Rate limiting | 60 req/min per token at ingress layer |
| Caching | Response cached in Redis for 30s per org_id to reduce DB load at peak check-in times |
| SLA | P95 < 500ms |
| Error handling | 401 on invalid/expired mobile token; 404 if org not found; 503 with Retry-After header on DB unavailability |
| Retry policy | Client responsibility; backend returns `Retry-After` header on 503 |

---

## IA4: Circuit Breaker Configuration

| Integration | Library | Failure Threshold | Break Duration | Half-Open Probe | Fallback Behavior |
|------------|---------|-------------------|----------------|-----------------|-------------------|
| INT-01 Oracle HIVE_CORE | `circuitbreaker` (Python) or Resilience4j-equivalent | 5 failures in 30s | 60 seconds | 1 test request | Return 503 `{"error": "Database temporarily unavailable"}` |
| INT-02 Oracle HIVE_CHECKIN | `circuitbreaker` (Python) | 5 failures in 30s | 60 seconds | 1 test request | Return 503; queue write for retry if idempotent (settings update); alert ops |
| INT-03 Redis | Inline fallback (no circuit breaker library needed) | 2 consecutive timeouts | Automatic reconnect with exponential backoff | — | Fall back to Oracle session lookup; log degraded mode |
| INT-04/05 (in-process) | N/A — exception boundary | N/A | N/A | N/A | Return 500; log exception with stack trace |
| INT-06 Mobile (inbound) | N/A — inbound endpoint | N/A | N/A | N/A | Return appropriate HTTP status; mobile client handles retry |

**Circuit Breaker State Machine:**
```
CLOSED ──(threshold exceeded)──► OPEN ──(break duration elapsed)──► HALF-OPEN
  ▲                                                                       │
  └────────────────────(probe succeeds)──────────────────────────────────┘
              (probe fails → back to OPEN)
```

---

## IA5: Retry Policies

| Integration | Max Retries | Backoff Strategy | Max Delay | Idempotency Check | Non-Retryable Codes |
|------------|-------------|-----------------|-----------|-------------------|---------------------|
| INT-01 Oracle (reads) | 3 | Exponential: 100ms, 200ms, 400ms | 400ms | N/A (reads) | 4xx responses |
| INT-01 Oracle (writes) | 2 | Linear: 200ms, 200ms | 400ms | VERSION_NUM optimistic lock; duplicate write returns 409 | 4xx, 409 Conflict |
| INT-02 Oracle (settings PUT) | 2 | Linear: 200ms, 200ms | 400ms | Setting ID + VERSION_NUM; idempotent if value unchanged | 4xx, 409 Conflict |
| INT-03 Redis | 2 | Linear: 50ms, 50ms | 100ms total | N/A | Any non-transient error → skip to fallback |
| INT-06 Mobile (outbound DB read) | 2 | Exponential: 100ms, 200ms | 200ms | N/A (read) | 4xx |

**Retry Decision Logic:**
```
IF response is 5xx AND attempt < max_retries:
    wait(backoff_delay)
    retry
ELIF response is 4xx:
    do NOT retry — client error; surface immediately
ELIF circuit_breaker == OPEN:
    do NOT retry — return fallback immediately
```

---

## IA6: Event-Driven Architecture

### 6.1 Current Scope

The Driver Check In Admin Module in Sprints 1–4 does **not** introduce a message broker or asynchronous event bus. All interactions are synchronous request/response over HTTPS REST.

The following table documents the in-process domain events raised within the application and persisted to AUDIT_LOGS (Sprint 4). These are **not** published to an external event bus in this release.

### 6.2 Internal Domain Events

| Event Name | Producer | Consumer | Persistence | Trigger |
|-----------|---------|---------|-------------|---------|
| `setting.toggle.changed` | Settings Service | Audit Service (in-process) | AUDIT_LOGS | Admin changes toggle state |
| `setting.value.changed` | Settings Service | Audit Service (in-process) | AUDIT_LOGS | Admin changes input value on blur/auto-save |
| `qrcode.generated` | QR Service | Application log | Structured log only | Admin opens QR modal and generates code |
| `user.login.succeeded` | Auth Service | Application log | Structured log only | Successful authentication |
| `user.login.failed` | Auth Service | Application log | Structured log only | Failed authentication attempt |
| `user.logout` | Auth Service | Redis (blocklist) + Application log | Redis + Structured log | Logout request |

### 6.3 Event Schema (Canonical — Internal)

All domain events follow this canonical envelope for consistency. If an external event bus is adopted in a future sprint, this schema maps directly to CloudEvents 1.0.

```json
{
  "specversion": "1.0",
  "type": "com.schreiber.hive.checkin.setting.toggle.changed",
  "source": "/hive/driver-checkin-admin",
  "id": "<uuid-v4>",
  "time": "<ISO-8601-UTC>",
  "datacontenttype": "application/json",
  "data": {
    "org_id": "<uuid>",
    "user_id": "<uuid>",
    "setting_id": "<uuid>",
    "setting_name": "<string>",
    "old_value": "<string|boolean>",
    "new_value": "<string|boolean>",
    "correlation_id": "<X-Correlation-Id header value>"
  }
}
```

### 6.4 Future Event Bus Readiness

When a message broker (e.g., Azure Service Bus, Kafka) is introduced, the following topics are pre-defined for this domain:

| Topic Name | Publisher | Subscriber(s) | Trigger |
|-----------|---------|--------------|---------|
| `hive.checkin.settings.changed` | Settings Service | TBD (reporting, notifications) | Setting toggle or value change |
| `hive.checkin.qr.generated` | QR Service | TBD (analytics) | QR code generation |

---

## IA7: Inbound Webhook Handling

No inbound webhooks are introduced in Sprints 1–4. This section is reserved for future integrations (e.g., mobile push notification callbacks, external identity provider events).

**When webhooks are added, they must follow:**
- HMAC-SHA256 signature verification on every inbound request
- Idempotency key (`X-Webhook-Id` header) checked against Redis to deduplicate replayed events
- Webhook endpoint returns 200 immediately; processing is asynchronous
- Failed processing is retried up to 3 times with exponential backoff; dead-letter to audit log after exhaustion

---

## IA8: API Standards & Contracts

### 8.1 Request/Response Envelope

```json
// Success
{
  "data": { ... },
  "meta": {
    "correlation_id": "...",
    "timestamp": "...",
    "version": "1.0"
  }
}

// Error (RFC 7807 ProblemDetails)
{
  "type": "https://hive.schreiber.com/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "The field 'input_value' is required when toggle is ON.",
  "instance": "/api/v1/driver-checkin/settings/abc123",
  "errors": [
    { "field": "input_value", "message": "A value is required" }
  ]
}
```

### 8.2 Headers

| Header | Direction | Purpose |
|--------|-----------|---------|
| `Authorization: Bearer <jwt>` | Inbound (Mobile API only) | Mobile token auth |
| `X-Correlation-Id` | Both | Request tracing; generated at ingress if absent |
| `X-Organization-Id` | Inbound | Org context for all admin API calls; validated against JWT claim |
| `Content-Type: application/json` | Both | All REST endpoints |
| `Retry-After: <seconds>` | Outbound | Returned with 503 responses to guide client retry |

### 8.3 Versioning

All endpoints are versioned at `/api/v1/`. Breaking changes require a new version prefix (`/api/v2/`). The v1 endpoints must remain available for a minimum of one sprint after v2 introduction to support rolling deployments.

---

## IA9: Security Controls for Integrations

| Integration | Control | Implementation |
|------------|---------|---------------|
| INT-01/02 Oracle | Credential rotation | Vault-managed secrets; rotation without pod restart via dynamic secrets |
| INT-01/02 Oracle | Least privilege | App service account has CRUD on HIVE_CHECKIN; read-only on HIVE_CORE where sufficient |
| INT-03 Redis | Network isolation | Redis accessible only within AKS cluster network; not exposed externally |
| INT-03 Redis | Auth | Redis AUTH password; TLS channel |
| INT-06 Mobile | Token isolation | Mobile JWT `aud=mobile` claim; API Gateway rejects mobile tokens on admin endpoints |
| INT-06 Mobile | Rate limiting | 60 req/min per token enforced at ingress |
| All inbound | CORS | React SPA origin whitelisted; mobile API allows defined mobile app origins only |
| All inbound | Input validation | Pydantic v2 models validate all request bodies; 422 on schema violation before business logic executes |

---

## IA10: Integration ADRs

### ADR-INT-01: In-Process Libraries for QR and PDF (No External Service)
- **Status:** Accepted (Sprint 3)
- **Context:** QR code and PDF generation are needed for the admin QR modal. Options: external SaaS (e.g., QR code API), or in-process Python libraries.
- **Decision:** Use `python qrcode` (in-process) for QR generation and ReportLab or WeasyPrint (in-process) for PDF. No external network call; no external service dependency; no additional SLA risk.
- **Consequences:** CPU cost borne by backend pods; acceptable at projected admin usage volume. No network failure path for QR/PDF generation.

### ADR-INT-02: Redis as Soft Dependency (Graceful Degradation)
- **Status:** Accepted (Sprint 1)
- **Context:** Redis is used for session caching and JWT blocklist. A hard dependency would make Redis unavailability a full auth outage.
- **Decision:** Redis is a soft dependency. On connection failure, auth middleware falls back to Oracle-based session lookup. Performance degrades but service remains available. Logout blocklist writes are retried; if Redis is unavailable, logout is still acknowledged (token expires naturally).
- **Consequences:** Slightly elevated DB load during Redis outage. Revoked tokens may briefly remain valid during Redis failure; acceptable risk given short token TTL.

### ADR-INT-03: Separate Mobile Auth Token (Audience Isolation)
- **Status:** Accepted (Sprint 4)
- **Context:** Driver mobile app must read settings but must never gain admin capabilities even if a token is intercepted or misconfigured.
- **Decision:** Mobile tokens carry `aud=mobile` JWT claim. API Gateway and FastAPI middleware reject mobile tokens on any non-mobile endpoint. Admin tokens are never issued to mobile clients.
- **Consequences:** Two token issuance flows to maintain. Mobile token rotation and expiry policy must be defined in Sprint 4.

### ADR-INT-04: Optimistic Locking for Settings Auto-Save
- **Status:** Accepted (Sprint 2)
- **Context:** Auto-save fires on every focus-out event. Concurrent admin sessions (or rapid successive saves) could cause write conflicts.
- **Decision:** DRIVER_CHECKIN_SETTINGS table carries `VERSION_NUM`. PUT requests must include the current version; server increments on success and returns 409 Conflict on stale version. Frontend re-fetches current value on 409 and retries.
- **Consequences:** Slightly more complex frontend state management. Eliminates silent data loss from concurrent writes.

---

## IA11: Monitoring & Alerting for Integrations

| Integration | Key Metric | Alert Threshold | Action |
|------------|-----------|----------------|--------|
| INT-01/02 Oracle | Connection pool utilization | > 80% | Scale backend pods; investigate query performance |
| INT-01/02 Oracle | Query P95 latency | > 500ms | Investigate slow queries; check index health |
| INT-03 Redis | Connection error rate | > 5% in 60s | Alert ops; verify Redis health; monitor DB fallback load |
| INT-03 Redis | Cache hit rate (mobile) | < 70% | Investigate; check TTL configuration |
| INT-06 Mobile | P95 response time | > 500ms | Alert; check DB query plan; verify mobile cache TTL |
| All | Circuit breaker OPEN events | Any | Immediate alert to on-call; auto-remediation investigation |
| All | 5xx error rate | > 1% in 5min | Alert on-call |
