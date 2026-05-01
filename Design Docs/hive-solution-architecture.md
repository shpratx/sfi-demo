# Solution Architecture
## Driver Check In Admin Module — The Hive (Schreiber Foods)
**Document Version:** 1.0.0
**Baseline Reference:** kb-L3-driver-checkin-baseline v0.1.0
**Status:** Greenfield — all sections authored for Sprint 1–4 scope

---

## SA1: System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCHREIBER FOODS ECOSYSTEM                           │
│                                                                             │
│  ┌────────────┐      HTTPS/JWT      ┌──────────────────────────────────┐   │
│  │   HIVE     │◄───────────────────►│     HIVE APPLICATION PLATFORM    │   │
│  │   Admin    │                     │                                  │   │
│  │  (Browser) │                     │  ┌──────────┐  ┌─────────────┐  │   │
│  └────────────┘                     │  │  React   │  │  FastAPI    │  │   │
│                                     │  │  18 SPA  │  │  Backend   │  │   │
│  ┌────────────┐      HTTPS/JWT      │  │          │  │  (Python)  │  │   │
│  │  Standard  │◄───────────────────►│  └──────────┘  └─────────────┘  │   │
│  │   User     │                     │        │               │          │   │
│  │  (Browser) │                     └────────┼───────────────┼──────────┘   │
│  └────────────┘                              │               │              │
│                                              │               │              │
│  ┌────────────┐      REST/JWT        ┌───────▼───────────────▼──────────┐  │
│  │   Driver   │◄───────────────────►│          PLATFORM SERVICES        │  │
│  │  Mobile    │   (Read-Only API)    │                                  │  │
│  │    App     │                      │  ┌──────────┐  ┌─────────────┐  │  │
│  └────────────┘                      │  │ Oracle   │  │    Redis    │  │  │
│                                      │  │  19c DB  │  │   Cache     │  │  │
│                                      │  │HIVE_CORE │  │  (Session)  │  │  │
│                                      │  │HIVE_CHKN │  └─────────────┘  │  │
│                                      │  └──────────┘                   │  │
│                                      └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Actors

| Actor | Type | Interaction | Auth Method |
|-------|------|-------------|-------------|
| HIVE Admin | Human — internal Schreiber staff | Full admin access: org management, settings, QR generation | JWT RS256 + HttpOnly cookie, ROLE=ADMIN |
| Standard User | Human — internal Schreiber staff | Read-only or scoped access; gated by RBAC | JWT RS256 + HttpOnly cookie, ROLE=STANDARD |
| Driver (Mobile App) | System actor — mobile device | Read settings for their org at check-in time | Separate mobile auth token; read-only endpoint |

### External Systems

| System | Role | Sprint |
|--------|------|--------|
| Oracle 19c | Persistent data store (HIVE_CORE + HIVE_CHECKIN schemas) | 1 |
| Redis | Session cache, JWT invalidation list | 1 |
| Python qrcode library | Server-side QR image generation | 3 |
| ReportLab / WeasyPrint | PDF generation for QR download | 3 |

---

## SA2: Bounded Contexts

| Context | Responsibility | Key Entities | Schema | Sprint |
|---------|---------------|--------------|--------|--------|
| **Identity & Auth** | Login, JWT issuance/refresh/revocation, role enforcement, session lifecycle | User, Session, Role, JWT Claim | HIVE_CORE | 1 |
| **Organization Management** | CRUD for organizations; user-org assignment; per-org isolation boundary | Organization, UserOrganization | HIVE_CORE | 1 |
| **Driver Check In Settings** | Admin configuration of the 10 check-in settings per org; toggle and input persistence; auto-save; audit trail | DriverCheckinSetting, AuditLog | HIVE_CHECKIN | 2–4 |
| **QR Code & Access** | Generation of org-specific QR codes; PDF packaging; print support | QRCodeArtifact (transient) | — (no persistence; generated on demand) | 3 |
| **Mobile API** | Read-only projection of settings for the Driver mobile app; isolated auth | MobileSettingsView | HIVE_CHECKIN (read) | 4 |

### Context Map

```
[Identity & Auth] ──── upstream ────► [Organization Management]
[Identity & Auth] ──── upstream ────► [Driver Check In Settings]
[Identity & Auth] ──── upstream ────► [QR Code & Access]
[Identity & Auth] ──── upstream ────► [Mobile API]
[Organization Management] ─ conformist ─► [Driver Check In Settings]
[Driver Check In Settings] ─ read model ─► [Mobile API]
```

---

## SA3: Technology Decisions

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend framework | React | 18 | Component reusability, ecosystem maturity, TypeScript support (ADR-01) |
| Frontend language | TypeScript | 5.x | Type safety, IDE tooling, reduced runtime errors (ADR-01) |
| Frontend styling | Tailwind CSS | 3.x | Utility-first, design token alignment, no runtime CSS-in-JS cost (ADR-01) |
| Frontend components | Radix UI | Latest | Accessible primitives, WCAG 2.1 AA compliant out of box (ADR-01) |
| Backend language | Python | 3.12 | LTS, async support, rich ORM/testing ecosystem (ADR-02) |
| Backend framework | FastAPI | Latest | Async-first, OpenAPI auto-generation, Pydantic validation (ADR-02) |
| ORM | SQLAlchemy | 2.x | Oracle dialect support, async sessions (ADR-02) |
| Database driver | oracledb | Latest | Thin-mode Oracle connection, replaces cx_Oracle (BL6) |
| Database | Oracle 19c | 19c | Enterprise standard at Schreiber Foods; TDE at rest (ADR-03) |
| Migration framework | Alembic | Latest | Additive-only, zero-downtime migrations (ADR-03a) |
| Session cache | Redis | 7.x | In-process session store; JWT blocklist on logout (BL6) |
| Auth mechanism | JWT RS256 + HttpOnly cookie | — | Stateless, XSS-resistant; separate public/private key pair (ADR-04) |
| QR generation | Python qrcode | Latest | Server-side generation; no external dependency (ADR-06) |
| PDF generation | ReportLab or WeasyPrint | Latest | PDF packaging for QR download (BL6) |
| Unit testing (BE) | pytest + factory_boy | — | BL12 test strategy |
| Unit testing (FE) | Jest / Vitest + RTL | — | BL12 test strategy |
| E2E testing | Playwright | — | BL12 test strategy |
| Security scanning | Bandit + Trivy + Snyk | — | Zero critical/high target (BL12) |
| Accessibility audit | axe-core + Playwright | — | WCAG 2.1 AA (BL12, BL15) |

---

## SA4: Security Architecture

### 4.1 Authentication Flow

```
Browser                        FastAPI Backend                  Oracle / Redis
  │                                  │                               │
  │── POST /api/v1/auth/login ───────►│                               │
  │   { email, password }            │── verify password hash ───────►│
  │                                  │◄── user record ────────────────│
  │                                  │── generate RS256 JWT           │
  │                                  │   (sub, role, org_id, exp)     │
  │                                  │── store session ref ───────────►│ (Redis)
  │◄── 200 Set-Cookie: access_token ─│                               │
  │    HttpOnly; Secure; SameSite=Strict                              │
  │                                  │                               │
  │── subsequent requests ───────────►│                               │
  │   Cookie: access_token           │── verify JWT signature         │
  │                                  │── check Redis blocklist ───────►│
  │                                  │── enforce RBAC role claim      │
  │◄── 200 / 403 ────────────────────│                               │
  │                                  │                               │
  │── POST /api/v1/auth/logout ──────►│                               │
  │                                  │── add jti to Redis blocklist ──►│
  │◄── 200 + clear cookie ───────────│                               │
```

### 4.2 Role-Based Access Control

| Role | Capabilities | Gating Mechanism |
|------|-------------|-----------------|
| ADMIN | All screens, all API endpoints, settings CRUD, QR generation | JWT `role=ADMIN` claim; server-side check on every protected endpoint |
| STANDARD | Limited to screens/APIs assigned by business rules; 403 on admin routes | JWT `role=STANDARD`; middleware guard; 403 page at /403 |
| Mobile (Driver) | GET /api/v1/driver-checkin/settings/mobile only | Separate short-lived token; endpoint only accepts mobile auth header |

### 4.3 Encryption

| Layer | Mechanism | Standard |
|-------|-----------|----------|
| Data at rest | Oracle TDE (Transparent Data Encryption) on HIVE_CORE and HIVE_CHECKIN | AES-256 |
| PII columns | EMAIL in USERS table encrypted at column level via TDE | AES-256 |
| Data in transit | TLS 1.2+ enforced on all ingress; internal service communication also TLS | TLS 1.2/1.3 |
| JWT signing | RS256 asymmetric key pair; private key stored in secrets manager | RSA-2048+ |
| Session cache | Redis AUTH + TLS channel | — |

### 4.4 Per-Org Isolation

Every API request carrying an `X-Organization-Id` header is validated server-side:
- JWT `org_id` claim must match the header value
- All DB queries include `WHERE org_id = :org_id` predicate
- No cross-org data leakage is possible via query construction

### 4.5 Audit Trail

All setting mutations are written to `AUDIT_LOGS` (Sprint 4, HIVE_CHECKIN schema):
- Captures: `user_id`, `action`, `setting_id`, `old_value`, `new_value`, `timestamp`
- Immutable append-only pattern; no UPDATE/DELETE on audit rows
- Satisfies compliance requirement BL14

---

## SA5: Deployment Model

### 5.1 Container Architecture

```
┌─────────────────────── AKS Cluster ────────────────────────────┐
│                                                                  │
│  Namespace: hive-checkin                                         │
│  ┌──────────────────┐   ┌──────────────────┐                   │
│  │  hive-frontend   │   │  hive-backend    │                   │
│  │  (React SPA)     │   │  (FastAPI)       │                   │
│  │  Nginx container │   │  Uvicorn/Gunicorn│                   │
│  │  HPA: 2–6 pods   │   │  HPA: 2–8 pods  │                   │
│  └──────────────────┘   └──────────────────┘                   │
│           │                      │                              │
│  ┌────────▼──────────────────────▼──────┐                      │
│  │         Ingress / API Gateway        │                      │
│  │  TLS termination, rate limiting      │                      │
│  └──────────────────────────────────────┘                      │
│                                                                  │
│  Namespace: hive-data (shared / existing)                        │
│  ┌────────────────┐   ┌────────────────┐                        │
│  │  Oracle 19c    │   │  Redis 7.x     │                        │
│  │  (StatefulSet  │   │  (StatefulSet) │                        │
│  │   or managed)  │   │                │                        │
│  └────────────────┘   └────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Scaling Policy

| Service | Min Pods | Max Pods | Scale Trigger |
|---------|----------|----------|---------------|
| hive-frontend | 2 | 6 | CPU > 70% |
| hive-backend | 2 | 8 | CPU > 70% / RPS threshold |
| Redis | 1 | — (single primary + replica) | — |

### 5.3 Disaster Recovery

| Aspect | Approach |
|--------|---------|
| Database backup | Oracle RMAN daily full + hourly incremental; stored to separate AZ |
| Redis | Replica in secondary AZ; session loss acceptable on failover (re-login required) |
| RTO | < 4 hours |
| RPO | < 1 hour |
| Zero-downtime deploy | Rolling update strategy; Alembic additive-only migrations (ADR-03a) |

---

## SA6: Data Architecture

### 6.1 Schema Overview

```
HIVE_CORE schema (Sprint 1)
├── USERS           (identity, roles, PII: EMAIL encrypted via TDE)
├── ORGANIZATIONS   (org master data)
└── USER_ORGANIZATIONS (user ↔ org assignment, many-to-many)

HIVE_CHECKIN schema (Sprint 2–4)
├── DRIVER_CHECKIN_SETTINGS (10 settings per org, toggle + input value)
└── AUDIT_LOGS              (immutable change log, Sprint 4)
```

### 6.2 Standard Column Set (All Tables)

All tables include: `ID (PK)`, `CREATED_AT`, `CREATED_BY`, `UPDATED_AT`, `UPDATED_BY`, `IS_DELETED`, `VERSION_NUM`

- `IS_DELETED`: soft-delete pattern; no physical row removal
- `VERSION_NUM`: optimistic locking (incremented on each UPDATE; stale write returns 409)

### 6.3 Settings Seed Data

10 settings seeded per organization at org creation (Sprint 2 migration):

| Setting Name | Default Toggle | Toggle Locked | Input Type |
|---|---|---|---|
| Organization Name | ON | Yes | Text (disabled) |
| QR Code Check In Access | ON | No | Action button |
| Driver Name | ON | Yes | — |
| Driver ID | ON | No | — |
| Driver Phone Number | ON | Yes | — |
| Truck Number | ON | Yes | — |
| Carrier Approval Step | ON | No | — |
| Temperature Acknowledgement | OFF | No | Alphanumeric |
| Early Check In Step | OFF | No | Numeric + Text |
| Confirmation Step | ON | No | Free text |

### 6.4 Data Retention

| Data Category | Retention | Basis |
|---|---|---|
| User accounts | Indefinite while active; soft-deleted on deactivation | Operational |
| Org settings | Indefinite; versioned via VERSION_NUM | Operational |
| Audit logs | Minimum 2 years | Compliance (BL14) |
| Redis sessions | TTL = access token expiry | Security |

---

## SA7: Cross-Cutting Concerns

### 7.1 Observability

| Signal | Implementation | Coverage |
|--------|---------------|---------|
| Structured logging | Python `structlog` with JSON output; correlation via `X-Correlation-Id` header propagated to all log lines | All backend services |
| Request tracing | `X-Correlation-Id` generated at ingress if absent; threaded through FastAPI middleware | All API requests |
| Health probes | GET /health (liveness), GET /health/ready (readiness) — BL4 | AKS pod lifecycle |
| Metrics | Prometheus endpoint via `prometheus-fastapi-instrumentator` | Backend pods |
| Error reporting | Structured error logs; RFC 7807 ProblemDetails on 4xx/5xx responses (BL13) | All API endpoints |

### 7.2 Feature Flags

Not introduced in this release. Feature flags may be added in a future sprint if phased rollout per org is required. When adopted, each flag should be stored in DRIVER_CHECKIN_SETTINGS as a dedicated setting row rather than a separate feature flag service, maintaining per-org isolation.

### 7.3 Audit Logging

| Event | Logged To | Fields |
|-------|-----------|--------|
| Setting toggle changed | AUDIT_LOGS | user_id, action=TOGGLE_CHANGE, setting_id, old_value, new_value, timestamp |
| Setting input value changed | AUDIT_LOGS | user_id, action=VALUE_CHANGE, setting_id, old_value, new_value, timestamp |
| User login | Application log (structured) | user_id, ip_address, timestamp, success/failure |
| QR code generated | Application log (structured) | user_id, org_id, timestamp |

---

## SA8: Architecture Decision Records

### ADR-01: React 18 + TypeScript + Tailwind + Radix UI
- **Status:** Accepted (Sprint 1)
- **Context:** Need a modern, accessible, maintainable frontend framework aligned with Schreiber HIVE platform standards.
- **Decision:** React 18 with TypeScript for type safety; Tailwind CSS for utility-first styling against design tokens (BL11); Radix UI for accessible headless components satisfying WCAG 2.1 AA (BL12).
- **Consequences:** Slightly higher initial setup; long-term benefits in maintainability, accessibility compliance, and type safety.

### ADR-02: Python 3.12 + FastAPI
- **Status:** Accepted (Sprint 1)
- **Context:** Need an async-capable, well-typed backend framework with strong ORM support for Oracle.
- **Decision:** FastAPI provides async request handling, automatic OpenAPI documentation, and Pydantic v2 validation. SQLAlchemy 2.x with oracledb driver provides async Oracle connectivity.
- **Consequences:** Team requires Python/FastAPI proficiency. Async patterns must be applied consistently to avoid event-loop blocking.

### ADR-03: Oracle 19c with Separate Schemas (HIVE_CORE / HIVE_CHECKIN)
- **Status:** Accepted (Sprint 1)
- **Context:** Schreiber enterprise standard database. Schema separation provides logical isolation between platform-wide identity data and the Driver Check In feature domain.
- **Decision:** HIVE_CORE for identity/org data (shared with broader HIVE platform). HIVE_CHECKIN for all Driver Check In feature tables. TDE enabled on both schemas.
- **Consequences:** Separate schema grants required for app service account. Cross-schema joins must be explicit.

### ADR-03a: Alembic — Additive-Only Migrations
- **Status:** Accepted (Sprint 1)
- **Context:** Zero-downtime deployments require that DB migrations never block running application versions.
- **Decision:** All Alembic migrations are additive only (new tables, new columns with defaults). No destructive operations (DROP COLUMN, ALTER NOT NULL on existing rows) without a multi-sprint deprecation plan.
- **Consequences:** Occasional orphaned columns during transition periods; schema stays backward-compatible across rolling deploys.

### ADR-04: JWT RS256 + HttpOnly Cookies
- **Status:** Accepted (Sprint 1)
- **Context:** Need stateless auth that resists XSS while supporting the SPA architecture. Mobile app requires a different auth pattern.
- **Decision:** RS256 asymmetric JWTs; delivered via HttpOnly Secure SameSite=Strict cookies for browser clients. A separate mobile token issuance path (Sprint 4) uses the same JWT library with a different audience claim.
- **Consequences:** Private key management is critical. Token rotation and Redis blocklist required for logout/revocation.

### ADR-05: Auto-Save on Focus Out
- **Status:** Accepted (Sprint 2)
- **Context:** UX requirement for zero-friction settings management. No explicit Save button.
- **Decision:** Each input field fires a PUT to `/api/v1/driver-checkin/settings/:id` on `blur`. Validation runs client-side before the request; backend validates again (defense-in-depth). Success shown via brief checkmark indicator.
- **Consequences:** Higher API call frequency than form-submit pattern. Backend must handle rapid successive PUTs idempotently (optimistic locking via VERSION_NUM prevents stale overwrites).

### ADR-06: Server-Side QR Generation (Python qrcode)
- **Status:** Accepted (Sprint 3)
- **Context:** QR code must embed an org-specific URL and be reproducible. Client-side generation risks inconsistency.
- **Decision:** POST to `/api/v1/driver-checkin/qr-code` returns a PNG image generated server-side by the Python `qrcode` library. PDF packaging via ReportLab or WeasyPrint for the download flow.
- **Consequences:** Server bears image generation CPU cost; acceptable at expected load. No external QR service dependency.

### ADR-07: Separate Mobile API Endpoint (Read-Only)
- **Status:** Accepted (Sprint 4)
- **Context:** Driver mobile app needs settings at check-in time. It must not share admin auth tokens and must only read (never write) settings.
- **Decision:** Dedicated endpoint `GET /api/v1/driver-checkin/settings/mobile` with a separate mobile-scoped auth claim. Returns only toggle_state and input_value; strips admin-only fields.
- **Consequences:** Separate auth token issuance flow for mobile. Endpoint must be independently rate-limited.

---

## SA9: Known Limitations & Open Decisions

| Ref | Description | Resolution Path |
|-----|-------------|-----------------|
| LIM-04 | Multi-org admin editing (can one admin manage multiple orgs?) | Business decision pending (GAP-03) |
| LIM-05 | Celsius/Fahrenheit unit selector for Temperature Acknowledgement | Business decision pending (GAP-04) |
| LIM-06 | Exact valid format for temperature input (numeric only? decimal?) | Business clarification needed (GAP-07) |
| LIM-07 | Early Check In violation workflow (what happens when driver checks in too early?) | Business decision pending (GAP-09) |

---

## SA10: NFR Compliance Matrix

| NFR | Target | Architectural Mechanism |
|-----|--------|------------------------|
| Auto-save latency < 2s | < 2 seconds | Async FastAPI handler; Oracle indexed lookup by org_id + setting_name; Redis eliminates repeated auth DB hits |
| Validation feedback < 200ms | < 200ms | Client-side validation runs on blur before network call; no round-trip required for format errors |
| Page load < 1s | < 1 second | React code splitting; Tailwind purge; Nginx static asset caching |
| Availability 99.9% | 99.9% | AKS HPA; multi-pod deployment; Oracle RMAN backup; Redis replica |
| WCAG 2.1 AA | Full compliance | Radix UI primitives; 44px touch targets (BL11); axe-core + Playwright audit (Sprint 4) |
| Zero critical/high vulns | Zero | Bandit (SAST), Trivy (container), Snyk (dependencies) — Sprint 4 gate |
