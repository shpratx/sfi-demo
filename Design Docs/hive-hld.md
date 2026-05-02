# High-Level Design (HLD)
## Driver Check In Admin Module — The Hive (Schreiber Foods)
**Document Version:** 1.0.0
**Baseline Reference:** kb-L3-driver-checkin-baseline v0.1.0
**Epic Coverage:** EP-01 through EP-05 (Sprints 1–4)
**Stack:** Python 3.12 + FastAPI (backend) · React 18 + TypeScript + Vite + TanStack Query + Zustand + React Hook Form + Zod (frontend)

---

## 1. System Component Diagram

```mermaid
graph TB
    subgraph Actors
        ADMIN[Admin Browser\nReact 18 SPA]
        STD[Standard User Browser\nReact 18 SPA]
        MOB[Driver Mobile App\nRead-Only Consumer]
    end

    subgraph Ingress
        GW[API Gateway / Nginx Ingress\nTLS termination · Rate limiting · CORS]
    end

    subgraph hive-checkin namespace
        FE[hive-frontend\nReact 18 · TypeScript · Tailwind\nNginx static host\nHPA: 2–6 pods]

        subgraph FastAPI Backend
            AUTH[Auth Service\nJWT RS256 · HttpOnly cookie\nBcrypt · Rate limiter]
            ORGAPI[Org API\nOrganization CRUD\nUser-Org assignment]
            SETTINGS[Settings API\nDriver Check-In settings\nAuto-save · Validation\nOptimistic lock]
            QRSVC[QR Service\nPNG generation\nPDF packaging]
            MOBILEAPI[Mobile API\nRead-only projection\nMobile JWT audience]
            AUDITLOG[Audit Logger\nAsync write\nAppend-only]
        end

        BE[hive-backend\nFastAPI · Uvicorn/Gunicorn\nHPA: 2–8 pods]
    end

    subgraph hive-data namespace
        ORA[(Oracle 19c\nHIVE_CORE schema\nHIVE_CHECKIN schema\nTDE at rest)]
        REDIS[(Redis 7.x\nSession cache\nJWT blocklist\nSettings cache)]
    end

    subgraph In-Process Libraries
        QRLIB[python-qrcode\nPNG generation]
        PDFLIB[ReportLab / WeasyPrint\nPDF generation]
    end

    ADMIN -->|HTTPS| GW
    STD -->|HTTPS| GW
    MOB -->|HTTPS · mobile JWT| GW
    GW --> FE
    GW --> BE
    FE -.->|REST API calls| GW

    BE --> AUTH
    BE --> ORGAPI
    BE --> SETTINGS
    BE --> QRSVC
    BE --> MOBILEAPI
    BE --> AUDITLOG

    AUTH -->|session store\nblocklist| REDIS
    SETTINGS -->|settings cache\n30s TTL| REDIS
    ORGAPI --> ORA
    SETTINGS --> ORA
    AUTH --> ORA
    AUDITLOG --> ORA
    MOBILEAPI --> REDIS
    MOBILEAPI --> ORA

    QRSVC --> QRLIB
    QRSVC --> PDFLIB
```

---

## 2. Data Flow Diagrams

### 2.1 Authentication Flow [EP-01 · F-01.1]

```mermaid
sequenceDiagram
    participant B as Browser
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant ORA as Oracle DB
    participant REDIS as Redis

    B->>GW: POST /api/v1/auth/login {email, password}
    GW->>AUTH: forward request
    AUTH->>ORA: SELECT user WHERE email = ?
    ORA-->>AUTH: user record (password_hash, role, org_id)
    AUTH->>AUTH: bcrypt.verify(password, hash)
    alt Valid credentials
        AUTH->>AUTH: generate RS256 access JWT\n(sub, role, org_id, jti, exp=30min)
        AUTH->>AUTH: generate refresh token\n(opaque, exp=7 days)
        AUTH->>REDIS: SET session:{jti} → {user_id, org_id} TTL=30min
        AUTH->>REDIS: SET refresh:{token} → {user_id, org_id} TTL=7d
        AUTH-->>GW: 200 Set-Cookie: refresh_token (HttpOnly, Secure, SameSite=Strict, 7d)\nAccess JWT returned in response body (short-lived)
        GW-->>B: 200 OK + access token in body + refresh cookie
    else Invalid credentials
        AUTH->>AUTH: increment failed_attempts counter
        alt attempts >= 5 within 15 min
            AUTH-->>GW: 429 account locked 15 min
        else
            AUTH-->>GW: 401 generic "Invalid credentials"
        end
        GW-->>B: error response
    end
```

### 2.2 Settings Load Flow [EP-02 · F-02.1, F-02.3]

```mermaid
sequenceDiagram
    participant B as Browser (Admin)
    participant GW as API Gateway
    participant SETTINGS as Settings API
    participant REDIS as Redis
    participant ORA as Oracle DB

    B->>GW: GET /api/v1/driver-checkin/settings\nCookie: access_token\nX-Organization-Id: {org_id}
    GW->>SETTINGS: forward + validate JWT
    SETTINGS->>SETTINGS: verify JWT signature\ncheck Redis blocklist\nvalidate org_id claim == header
    SETTINGS->>REDIS: GET settings:{org_id}
    alt Cache hit
        REDIS-->>SETTINGS: cached settings array
    else Cache miss
        SETTINGS->>ORA: SELECT * FROM HIVE_CHECKIN.DRIVER_CHECKIN_SETTINGS\nWHERE ORG_ID = :org_id AND IS_DELETED = 0
        ORA-->>SETTINGS: 10 setting rows
        SETTINGS->>REDIS: SET settings:{org_id} TTL=30s
    end
    SETTINGS-->>B: 200 {data: [settings], meta: {correlation_id}}
```

### 2.3 Auto-Save Flow [EP-02 · F-02.2]

```mermaid
sequenceDiagram
    participant B as Browser (Admin)
    participant GW as API Gateway
    participant SETTINGS as Settings API
    participant ORA as Oracle DB
    participant AUDIT as Audit Logger

    B->>GW: PUT /api/v1/driver-checkin/settings/{id}\n{toggle_state|input_value, version_num}
    GW->>SETTINGS: forward + validate JWT

    SETTINGS->>SETTINGS: client-side validation\nalready ran; backend re-validates\n(defense in depth)

    SETTINGS->>ORA: SELECT VERSION_NUM FROM DRIVER_CHECKIN_SETTINGS WHERE ID = :id\n[READ COMMITTED isolation]
    ORA-->>SETTINGS: current version

    alt version_num matches
        SETTINGS->>ORA: UPDATE DRIVER_CHECKIN_SETTINGS SET\n  toggle_state/input_value = :new_val\n  version_num = version_num + 1\n  updated_at = NOW()\n  updated_by = :user_id\nWHERE id = :id AND version_num = :expected\n[SERIALIZABLE isolation]
        ORA-->>SETTINGS: 1 row updated
        SETTINGS->>REDIS: DEL settings:{org_id}  ← invalidate cache
        SETTINGS->>AUDIT: async write audit entry\n(non-blocking)
        SETTINGS-->>B: 200 {data: {id, version_num: new_version}}
    else version_num stale
        SETTINGS-->>B: 409 Conflict\n"Settings modified by another user — reload to continue"
    end

    Note over AUDIT,ORA: Audit write failure → alert ops\ndoes NOT roll back settings save (US-034 AC-034-4)
```

### 2.4 QR Code Generation & PDF Download Flow [EP-04 · F-04.1–F-04.3]

```mermaid
sequenceDiagram
    participant B as Browser (Admin)
    participant GW as API Gateway
    participant QRSVC as QR Service
    participant ORA as Oracle DB
    participant QRLIB as python-qrcode
    participant PDFLIB as ReportLab/WeasyPrint

    B->>GW: POST /api/v1/driver-checkin/qr-code\nCookie: access_token
    GW->>QRSVC: forward + validate JWT (ADMIN role required)
    QRSVC->>ORA: SELECT name FROM HIVE_CORE.ORGANIZATIONS\nWHERE ID = :org_id
    ORA-->>QRSVC: org_name
    QRSVC->>QRLIB: generate_qr(url=mobile_checkin_url_for_org)
    QRLIB-->>QRSVC: PNG bytes (BytesIO, in-process)
    QRSVC-->>B: 200 Content-Type: image/png\n[QR PNG bytes]

    Note over B: Modal opens, QR image displayed

    B->>GW: GET /api/v1/driver-checkin/qr-code/pdf\nCookie: access_token
    GW->>QRSVC: forward + validate JWT
    QRSVC->>QRLIB: regenerate QR PNG
    QRSVC->>PDFLIB: build_pdf(qr_png, org_name)
    PDFLIB-->>QRSVC: PDF bytes
    QRSVC-->>B: 200 Content-Type: application/pdf\nContent-Disposition: attachment;\n filename="QR-{ORG_NAME}-checkin.pdf"
```

### 2.5 Mobile Settings Consumption Flow [EP-05 · F-05.1]

```mermaid
sequenceDiagram
    participant MOB as Driver Mobile App
    participant GW as API Gateway
    participant MAPI as Mobile API
    participant REDIS as Redis
    participant ORA as Oracle DB

    MOB->>GW: GET /api/v1/driver-checkin/settings/mobile\nAuthorization: Bearer {mobile_jwt}
    GW->>MAPI: forward
    MAPI->>MAPI: verify JWT aud=mobile claim\nextract org_id

    MAPI->>REDIS: GET mobile_settings:{org_id}
    alt Cache hit (30s TTL)
        REDIS-->>MAPI: filtered settings
    else Cache miss
        MAPI->>ORA: SELECT setting_name, input_value\nFROM HIVE_CHECKIN.DRIVER_CHECKIN_SETTINGS\nWHERE ORG_ID = :org_id\n  AND TOGGLE_STATE = 1\n  AND IS_DELETED = 0
        ORA-->>MAPI: enabled settings only
        MAPI->>REDIS: SET mobile_settings:{org_id} TTL=30s
    end

    MAPI-->>MOB: 200 {data: [{setting_name, input_value}]}\n(admin-only fields stripped)
```

---

## 3. Application Settings State Machine [EP-02 · BL8]

```mermaid
stateDiagram-v2
    [*] --> ToggleOFF : default state (new org)

    ToggleOFF --> ToggleON : admin enables toggle\n[not locked]
    ToggleON --> ToggleOFF : admin disables toggle\n[not locked]

    state ToggleON {
        [*] --> InputEmpty
        InputEmpty --> InputDirty : admin types
        InputDirty --> Validating : focus out (blur)
        Validating --> ValidationFailed : format/empty error
        Validating --> Saving : validation passes
        ValidationFailed --> InputDirty : admin corrects input
        Saving --> Saved : PUT 200 OK
        Saving --> SaveFailed : PUT 4xx/5xx
        SaveFailed --> Saving : admin retries
        Saved --> InputDirty : admin edits again
    }

    state LockedON {
        [*] --> AlwaysEnabled
        AlwaysEnabled --> AlwaysEnabled : no transition possible
    }

    note right of LockedON
        Applies to: Org Name, Driver Name,
        Driver Phone, Truck Number
        toggle aria-disabled=true
    end note

    note right of ToggleON
        For settings without input fields
        (Driver ID, Carrier Approval, QR):
        no inner state machine —
        toggle save is atomic
    end note
```

### Setting State Summary

| Setting | Default Toggle | Locked | Has Input | Input Required When ON |
|---------|---------------|--------|-----------|----------------------|
| Organization Name | ON | Yes | Yes (read-only, pre-populated) | N/A |
| QR Code Check In Access | ON | No | No (action button) | N/A |
| Driver Name | ON | Yes | No | N/A |
| Driver ID | ON | No | No | N/A |
| Driver Phone Number | ON | Yes | No | N/A |
| Truck Number | ON | Yes | No | N/A |
| Carrier Approval Step | ON | No | No | N/A |
| Temperature Acknowledgement | OFF | No | Yes (alphanumeric) | Yes |
| Early Check In Step | OFF | No | Yes (numeric hours + text) | Yes (both fields) |
| Confirmation Step | ON | No | Yes (free text) | Yes |

---

## 4. Deployment View [EP-01 · BL6]

```mermaid
graph TB
    subgraph AKS Cluster
        subgraph ns-hive-checkin [Namespace: hive-checkin]
            subgraph fe-deploy [hive-frontend Deployment]
                FE1[Pod 1\nNginx + React SPA]
                FE2[Pod 2\nNginx + React SPA]
                FEn[Pod n\nHPA max: 6]
            end
            subgraph be-deploy [hive-backend Deployment]
                BE1[Pod 1\nFastAPI + Uvicorn]
                BE2[Pod 2\nFastAPI + Uvicorn]
                BEn[Pod n\nHPA max: 8]
            end
            ING[Ingress Controller\nNginx · TLS 1.3\nRead: 200 req/min/user\nWrite: 50 req/min/user]
        end
        subgraph ns-hive-data [Namespace: hive-data — shared]
            ORA[(Oracle 19c StatefulSet\nor Managed Oracle\nHIVE_CORE + HIVE_CHECKIN\nTDE enabled)]
            REDIS_P[(Redis Primary\nStatefulSet)]
            REDIS_R[(Redis Replica\nStatefulSet)]
        end
    end

    ING --> fe-deploy
    ING --> be-deploy
    be-deploy --> ORA
    be-deploy --> REDIS_P
    REDIS_P --> REDIS_R

    subgraph HPA Rules
        FE_HPA[Frontend HPA\nMin: 2 · Max: 6\nScale: CPU > 70%]
        BE_HPA[Backend HPA\nMin: 2 · Max: 8\nScale: CPU > 70%]
    end
```

### Container Specs

| Service | Image Base | Port | Resources (request/limit) | Probes |
|---------|-----------|------|--------------------------|--------|
| hive-frontend | nginx:alpine (multi-stage: node:20-alpine build → nginx serve) | 80 | 100m/500m CPU · 128Mi/256Mi | `/` (200) |
| hive-backend | python:3.12-slim | 8000 | 250m/1000m CPU · 256Mi/512Mi | `/health` · `/health/ready` |
| hive-worker | python:3.12-slim (Celery worker) | — | 250m/1000m CPU · 256Mi/512Mi | Celery inspect ping |
| hive-scheduler | python:3.12-slim (Celery Beat) | — | 100m/500m CPU · 128Mi/256Mi | — |

> `hive-worker` and `hive-scheduler` are required by EA6 for async task processing (audit log writes, cache warm-up tasks). All images: non-root user, <200MB, health check defined.

### Rolling Deployment Strategy
- `strategy.type: RollingUpdate`
- `maxSurge: 1` · `maxUnavailable: 0`
- Alembic migration runs as a pre-deploy Job (additive-only; existing pods remain functional)
- Post-deploy smoke test: `GET /health/ready` must return 200 before traffic shifts

---

## 5. Security View [EP-01 · F-01.1, F-01.2]

```mermaid
sequenceDiagram
    participant B as Browser
    participant GW as Ingress/GW
    participant MW as FastAPI Auth Middleware
    participant REDIS as Redis
    participant EP as Protected Endpoint

    Note over GW: TLS 1.2/1.3 enforced\nHSTS header set\nCORS: only SPA origin

    B->>GW: Any request + Authorization: Bearer {access_token}\nRefresh cookie included automatically by browser
    GW->>MW: pass through (TLS terminated)
    MW->>MW: 1. Extract JWT from Authorization Bearer header
    MW->>MW: 2. Verify RS256 signature (public key)
    MW->>MW: 3. Check exp claim (access token: 30min)\n   If expired → client must POST /auth/refresh using HttpOnly refresh cookie
    MW->>REDIS: 4. GET blocklist:{jti}
    REDIS-->>MW: nil (not revoked) OR hit (revoked)
    alt Token valid & not revoked
        MW->>MW: 5. Check role claim vs endpoint requirement\n   ADMIN endpoints: role must = "ADMIN"\n   Mobile endpoints: aud must = "mobile"
        alt Role authorised
            MW->>MW: 6. Validate X-Organization-Id == JWT org_id
            MW->>EP: proceed to handler
            EP-->>B: 200 response
        else Role mismatch
            MW-->>B: 403 Forbidden
        end
    else Token invalid or revoked
        MW-->>B: 401 Unauthorized → UI redirects /login
    end
```

### Encryption Boundaries

| Boundary | Mechanism | Standard |
|----------|-----------|----------|
| Browser → Ingress | TLS 1.3 | All traffic |
| Ingress → Backend pods | TLS (cluster-internal) | mTLS optional |
| Oracle data at rest | TDE (Transparent Data Encryption) | AES-256 |
| EMAIL column (USERS) | Oracle TDE column-level | AES-256 |
| JWT signing key | RS256 private key in K8s Secret (Vault-sourced) | RSA-2048 |
| Redis channel | TLS + AUTH password | — |

---

## 6. Observability

| Signal | Tool | Key Metrics |
|--------|------|------------|
| Structured logs | `structlog 24.x` JSON → stdout → log aggregator | Every entry: timestamp, level, correlation_id, org_id, user_id, message (EA9) |
| Distributed tracing | OpenTelemetry | Traces across API → Service → DB → Redis; exported to configured backend (EA9) |
| Health probes | GET `/health` (liveness) · GET `/health/ready` (readiness — DB + Redis connected) | AKS pod lifecycle |
| Metrics | Prometheus (`prometheus-fastapi-instrumentator`) | Request rate · P95 latency · error rate per endpoint |
| Dashboards | Grafana | System health · API performance · error rates |
| Auto-save latency | Custom Prometheus histogram: PUT received → 200 response | Target < 2s (NFR-01) |
| Validation latency | Custom metric: blur event → error display | Target < 200ms (NFR-02) |
| Alerting | Grafana Alerts | P1: API down. P2: latency > 2× target. P3: error rate > 1% |
| Circuit breaker events | Log `CIRCUIT_OPEN` / `CIRCUIT_CLOSE` events | Alert on any OPEN event |

---

## 7. NFR Compliance Summary

| NFR | Target | Mechanism | Epic |
|-----|--------|-----------|------|
| Auto-save latency | < 2 seconds | Async FastAPI handler · indexed Oracle lookup · Redis eliminates repeated auth lookups | EP-02 |
| Validation feedback | < 200ms | Client-side validation on blur; no round-trip for format errors | EP-02 |
| Page load | < 1 second | React code-split · Tailwind purge · Nginx static caching · CDN headers | EP-02 |
| Availability | 99.9% | AKS HPA (min 2 pods) · Oracle RMAN backup · Redis replica | All |
| WCAG 2.1 AA | Full compliance | Radix UI primitives · 44px touch targets · axe-core + Playwright audit Sprint 4 | EP-05 |
| Zero critical vulns | Zero | Bandit (SAST) · Trivy (container) · Snyk (deps) — Sprint 4 gate | EP-05 |
