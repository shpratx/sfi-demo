# Application Baseline 
### kb-L3-driver-checkin-baseline v0.1.0 (Sprint 1)
### Living document — updated at the end of each sprint.

---

## BL1: Product Inventory

| Product | Type | Status | Parameters |
|---------|------|--------|------------|
| Driver Check In Admin Module | IMS Admin Feature | 🔨 Sprint 1 | 10 configurable settings, per-org isolation, QR code generation, mobile app sync |

---

## BL2: Feature Inventory

| Feature ID | Feature Name | Status | Sprint | Module | Description |
|---|---|---|---|---|---|
| F-01.1 | Authentication & Session Management | 🔨 Sprint 1 | 1 | Auth | Login, JWT, session, logout |
| F-01.2 | Role Management & Admin Authorization | 🔨 Sprint 1 | 1 | Auth | Admin vs Standard roles, menu gating, 403 |
| F-01.3 | Organization Data Model & Management | 🔨 Sprint 1 | 1 | Core | Org CRUD, user-org assignment |
| F-01.4 | IMS Navigation Framework & Tab System | 🔨 Sprint 1 | 1 | Core | Admin menu dropdown, in-app tabs |
| F-02.1 | Settings Page Framework & Toggle List | 📋 Sprint 2 | 2 | Settings | Toggle list layout, loading skeleton |
| F-02.2 | Auto-Save & Validation Engine | 📋 Sprint 2 | 2 | Settings | Focus-out save, inline validation, save indicator |
| F-02.3 | Settings Data Model, API & Persistence | 📋 Sprint 2 | 2 | Settings | DB schema, admin CRUD API, per-org persistence |
| F-02.4 | Organization Name & Driver Identity Settings | 📋 Sprint 2 | 2 | Settings | Org Name (locked), Driver Name/ID/Phone/Truck, Carrier Approval |
| F-02.5 | Help Text Component | 📋 Sprint 2 | 2 | Settings | Reusable help text with aria-describedby |
| F-03.1 | Temperature Acknowledgement Setting | 📋 Sprint 3 | 3 | Settings | Conditional input, alphanumeric validation |
| F-03.2 | Early Check In Setting | 📋 Sprint 3 | 3 | Settings | Hours (numeric) + instruction (text) with defaults |
| F-03.3 | Confirmation Step Setting | 📋 Sprint 3 | 3 | Settings | Customizable success message |
| F-04.1 | QR Code Generation Modal | 📋 Sprint 3 | 3 | QR | Modal with org title, QR image, Save/Print/Close |
| F-04.2 | QR Code Backend Generation Service | 📋 Sprint 3 | 3 | QR | QR image generation API |
| F-04.3 | QR Code PDF Download & Print | 📋 Sprint 3 | 3 | QR | PDF auto-download, system print dialog |
| F-05.1 | Mobile App Settings API | 📋 Sprint 4 | 4 | API | Read-only endpoint for mobile app |
| F-05.2 | Security & Accessibility Audit | 📋 Sprint 4 | 4 | Ops | SAST, WCAG 2.1 AA audit |
| F-05.3 | Error Handling, Audit Logging & Resilience | 📋 Sprint 4 | 4 | Ops | Error toast, audit log, optimistic locking |

Legend: 🔨 = Building | 📋 = Planned | ✅ = Live

---

## BL3: Screen Inventory

| Screen | Route | Feature | Sprint | Status |
|---|---|---|---|---|
| Login | /login | F-01.1 | 1 | 🔨 |
| 403 Forbidden | /403 | F-01.2 | 1 | 🔨 |
| Organization Management | /admin/organizations | F-01.3 | 1 | 🔨 |
| Driver Check In Admin | /admin/driver-checkin (new IMS tab) | F-02.1 | 2 | 📋 |
| QR Code Modal | (overlay on admin page) | F-04.1 | 3 | 📋 |

---

## BL4: API Inventory

| Method | Endpoint | Purpose | Sprint | Status |
|---|---|---|---|---|
| POST | /api/v1/auth/login | Authenticate, issue JWT | 1 | 🔨 |
| POST | /api/v1/auth/refresh | Refresh access token | 1 | 🔨 |
| POST | /api/v1/auth/logout | Invalidate session | 1 | 🔨 |
| GET | /api/v1/organizations | List organizations | 1 | 🔨 |
| POST | /api/v1/organizations | Create organization | 1 | 🔨 |
| PUT | /api/v1/organizations/:id | Update organization | 1 | 🔨 |
| GET | /api/v1/users | List users (admin) | 1 | 🔨 |
| POST | /api/v1/users | Create user | 1 | 🔨 |
| PUT | /api/v1/users/:id | Update user | 1 | 🔨 |
| GET | /api/v1/driver-checkin/settings | Get all settings for org | 2 | 📋 |
| PUT | /api/v1/driver-checkin/settings/:id | Update setting toggle/value | 2 | 📋 |
| POST | /api/v1/driver-checkin/qr-code | Generate QR code image | 3 | 📋 |
| GET | /api/v1/driver-checkin/settings/mobile | Mobile read-only settings | 4 | 📋 |
| GET | /health | Liveness probe | 1 | 🔨 |
| GET | /health/ready | Readiness probe | 1 | 🔨 |

---

## BL5: Data Model (Tables)

### Sprint 1 Tables (🔨)

| Table | Schema | Key Columns | PII | Sprint |
|---|---|---|---|---|
| USERS | IMS_CORE | ID, EMAIL, PASSWORD_HASH, FULL_NAME, ROLE, IS_ACTIVE | EMAIL (TDE) | 1 |
| ORGANIZATIONS | IMS_CORE | ID, NAME, ADDRESS, PHONE, IS_ACTIVE | — | 1 |
| USER_ORGANIZATIONS | IMS_CORE | ID, USER_ID(FK), ORG_ID(FK) | — | 1 |

### Sprint 2 Tables (📋)

| Table | Schema | Key Columns | Sprint |
|---|---|---|---|
| DRIVER_CHECKIN_SETTINGS | IMS_CHECKIN | ID, ORG_ID(FK), SETTING_NAME, TOGGLE_STATE, INPUT_VALUE, UPDATED_AT, UPDATED_BY | 2 |
| AUDIT_LOGS | IMS_CHECKIN | ID, USER_ID, ACTION, SETTING_ID, OLD_VALUE, NEW_VALUE, TIMESTAMP | 4 |

All tables include: ID (PK), CREATED_AT, CREATED_BY, UPDATED_AT, UPDATED_BY, IS_DELETED, VERSION_NUM.

### Settings Seed Data (10 settings per org)

| Setting Name | Default Toggle | Toggle Editable | Input Type | Default Value |
|---|---|---|---|---|
| Organization Name | ON | No (locked) | Text (disabled) | From user login |
| QR Code Check In Access | ON | Yes | — (action button) | — |
| Driver Name | ON | No (locked) | — | — |
| Driver ID | ON | Yes | — | — |
| Driver Phone Number | ON | No (locked) | — | — |
| Truck Number | ON | No (locked) | — | — |
| Carrier Approval Step | ON | Yes | — | — |
| Temperature Acknowledgement | OFF | Yes | Alphanumeric | Empty |
| Early Check In Step | OFF | Yes | Numeric + Text | Empty / Default instruction |
| Confirmation Step | ON | Yes | Free text | "Driver Check In is successfully completed!..." |

---

## BL6: Integration Inventory

| System | Protocol | Sprint | Status |
|---|---|---|---|
| Oracle DB | SQLAlchemy + oracledb | 1 | 🔨 |
| Alembic | DB migration framework | 1 | 🔨 |
| Redis (session cache) | In-process | 1 | 🔨 |
| QR Code Generator | Python qrcode library | 3 | 📋 |
| PDF Generator | ReportLab or WeasyPrint | 3 | 📋 |
| Mobile App (read settings) | REST API | 4 | 📋 |

---

## BL7: Known Limitations (Sprint 1)

| LIM ID | Description | Planned Resolution |
|---|---|---|
| LIM-01 | No settings page — only auth and org management | Sprint 2 delivers settings framework |
| LIM-02 | No QR code generation | Sprint 3 delivers QR modal |
| LIM-03 | No mobile app API | Sprint 4 delivers mobile read endpoint |
| LIM-04 | Multi-org admin editing TBD | GAP-03 in requirements — business decision pending |
| LIM-05 | Celsius/Fahrenheit selector TBD | GAP-04 in requirements — business decision pending |
| LIM-06 | Temperature valid format undefined | GAP-07 in requirements — needs business clarification |
| LIM-07 | Early Check In violation workflow TBD | GAP-09 in requirements — business decision pending |

---

## BL8: Settings Toggle Logic

```
FOR each setting on the Driver Check In Admin page:
  IF toggle is LOCKED (Organization Name, Driver Name, Phone, Truck):
    Toggle is always ON, cannot be changed
    Input field (if any) follows locked rules
  ELSE IF toggle is ACTIVE:
    Admin can switch ON/OFF
    ON → setting enabled on admin page AND mobile app
    OFF → setting disabled on admin page AND mobile app
    IF setting has input field:
      ON → input field enabled, validation active
      OFF → input field disabled, validation skipped
  
  FOR input fields:
    Auto-save on focus out
    Validate on focus out BEFORE save:
      Empty + required → "A value is required"
      Non-numeric (hours) → "Numbers only"
      Invalid format (temp) → "Invalid format"
    Save confirmation indicator (brief checkmark)
```

---

## BL9: Architecture Decisions

| ADR | Decision | Sprint | KB Reference |
|-----|----------|--------|-------------|
| ADR-01 | React 18 + TypeScript + Tailwind + Radix UI for frontend | 1 | EA1, EA10 |
| ADR-02 | Python 3.12 + FastAPI for backend | 1 | EA1, EA2 |
| ADR-03 | Oracle 19c with IMS_CORE and IMS_CHECKIN schemas | 1 | EA1, EA4 |
| ADR-03a | Alembic for database migrations (additive only, zero-downtime) | 1 | EA4 |
| ADR-04 | JWT RS256 with HttpOnly cookies | 1 | EA5 |
| ADR-05 | Auto-save on focus out (no explicit save button) | 2 | Source AC |
| ADR-06 | QR code generated server-side via Python qrcode library | 3 | FR-26 |
| ADR-07 | Separate mobile API endpoint (read-only, different auth) | 4 | FR-22, ADR-04 |

---

## BL10: Sprint Delivery Tracker

| Sprint | Version | Epics | Features | Stories | Points | Status |
|--------|---------|-------|----------|---------|--------|--------|
| 1 | v0.1 | EP-01 | 4 | 8 | 20 | 🔨 In Progress |
| 2 | v0.2 | EP-02 | 5 | 11 | 28 | 📋 Planned |
| 3 | v0.3 | EP-03, EP-04 | 6 | 9 | 26 | 📋 Planned |
| 4 | v1.0 | EP-05 | 3 | 7 | 18 | 📋 Planned |
| **Total** | | **5** | **18** | **35** | **92** | |

---

## BL11: Design System Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary | #00C2CB | Teal — CTAs, toggles ON, focus rings, active states |
| Dark | #0F0F1A | Nav bar, hero backgrounds |
| Success | #2ECC71 | Toggle ON indicator, save confirmation |
| Warning | #F7A800 | Amber — attention states |
| Error | #E74C3C | Validation errors, toggle OFF states |
| Neutral-50 to 900 | #F8F9FA to #212529 | Backgrounds, text, borders |
| Font Heading | Poppins | Headings, labels |
| Font Body | Inter | Body text, inputs |
| Spacing | 8px base grid | All spacing |
| Radius | 4/8/12px | Badges/inputs/cards |
| Touch target | 44px minimum | All interactive elements |

---

## BL12: Test Strategy

| Level | Framework | Target | Sprint 1 Scope |
|-------|-----------|--------|----------------|
| Unit (Backend) | pytest + factory_boy | ≥80% service layer | Auth, org CRUD |
| Unit (Frontend) | Jest/Vitest + RTL | ≥80% components | Login, nav, toggle component |
| Integration | pytest + TestClient | All API endpoints | Auth, org endpoints |
| E2E | Playwright | Critical journeys | Login → admin page → toggle setting |
| Security | Bandit + Trivy + Snyk | Zero critical/high | Sprint 4 full scan |
| Accessibility | axe-core + Playwright | WCAG 2.1 AA | Sprint 4 full audit |

---

## BL13: API Standards

- Base URL: `/api/v1/{resource}`
- Response envelope: `{ "data": ..., "meta": {...} }`
- Errors: RFC 7807 ProblemDetails
- JSON: camelCase responses
- Headers: Authorization (Bearer JWT), X-Correlation-Id, X-Organization-Id
- Auto-save: PUT on focus out, 200 OK with updated value
- Validation: 422 with field-level errors

---

## BL14: Compliance

| Requirement | Implementation |
|-------------|---------------|
| Admin-only access | RBAC with JWT role claim |
| Audit trail | All setting changes logged (who, what, when, old/new) |
| Per-org isolation | X-Organization-Id header, server-side validation |
| Data encryption | Oracle TDE at rest, TLS 1.2+ in transit |

---

## BL15: NFR Targets

| Category | Metric | Target |
|----------|--------|--------|
| Auto-save latency | Focus out to save complete | < 2 seconds |
| Validation feedback | Focus out to error display | < 200ms |
| Page load | Settings page initial load | < 1 second |
| Availability | System uptime | 99.9% |
| Accessibility | WCAG compliance | 2.1 AA |
| Security | Vulnerability scan | Zero critical/high |

---

## BL16: UX/UI Artifacts

| Artifact | File | Content | Status |
|----------|------|---------|--------|
| Wireframes (HTML) | driver-checkin-complete-wireframes.html | ALL epics: Login (4 states), 403 page, Admin menu+tabs, Org management+modal, Full settings page (10 settings), Validation states (3 types), Auto-save states (saving/saved/failed), QR modal (PDF/Print/Close), Toggle reference table | ✅ Complete |
| Design System | ims-design-system.md | Brand tokens, components | ✅ Complete |
