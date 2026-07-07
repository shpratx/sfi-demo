# User Flow Diagrams
**Document Version:** 1.0.0
**Baseline Reference:** kb-L3-driver-checkin-baseline v0.1.0
**Wireframes Reference:** driver-checkin-complete-wireframes.html (✅ Complete — all epics)
**Epic Coverage:** EP-01 through EP-05 (Sprints 1–4)

> All flows in this document are **[NEW]** — this is a greenfield module with no prior user flows.
> Nodes are annotated with the Epic and Feature that delivers them.

---

## Flow Index

| # | Flow Name | Epic(s) | Sprint | Primary Actor |
|---|-----------|---------|--------|---------------|
| 1 | Authentication — Login & Session Lifecycle | EP-01 | 1 | Admin / Standard User |
| 2 | Role Enforcement & Access Control | EP-01 | 1 | Admin / Standard User |
| 3 | Organization Management | EP-01 | 1 | Admin |
| 4 | IMS Navigation & Tab System | EP-01 | 1 | Admin |
| 5 | Settings Page Load & Display | EP-02 | 2 | Admin |
| 6 | Toggle a Setting (Core Flow) | EP-02 | 2 | Admin |
| 7 | Auto-Save & Validation (Input Field) | EP-02 | 2 | Admin |
| 8 | Advanced Settings — Temperature, Early Check In, Confirmation | EP-03 | 3 | Admin |
| 9 | QR Code Generation, Download & Print | EP-04 | 3 | Admin |
| 10 | Mobile App Settings Consumption | EP-05 | 4 | Driver Mobile App (System) |
| 11 | Error Recovery — Save Failure | EP-05 | 4 | Admin |
| 12 | End-to-End Admin Journey (Composite) | EP-01–05 | 1–4 | Admin |

---

## Flow 1: Authentication — Login & Session Lifecycle
**Features:** F-01.1 | **Stories:** US-001, US-002
**Screen:** Login `/login`

```
                         ┌─────────────────────┐
                         │     /login Screen   │
                         │  [EP-01 · F-01.1]  │
                         │                     │
                         │  Email ____________ │
                         │  Password _________ │
                         │  [ Log In ]         │
                         └──────────┬──────────┘
                                    │
                          User submits form
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          Valid credentials                  Invalid credentials
                    │                               │
                    ▼                               ▼
         ┌──────────────────┐            ┌──────────────────────┐
         │ JWT issued       │            │ Generic error shown: │
         │ RS256 · 8hr TTL  │            │ "Invalid credentials" │
         │ HttpOnly cookie  │            │ (no field hint)       │
         │ set              │            │                       │
         └────────┬─────────┘            │ After 5 failed       │
                  │                      │ attempts in 15 min:  │
                  ▼                      │ "Account locked for  │
         ┌──────────────────┐            │  15 minutes"         │
         │ Redirect to      │            └──────────────────────┘
         │ IMS main page   │
         │ (role-aware nav) │
         └────────┬─────────┘
                  │
         ┌────────┴──────────────────────────────────┐
         ▼                                           ▼
  Admin role in JWT                         Standard role in JWT
         │                                           │
         ▼                                           ▼
  Administration menu                       Administration menu
  VISIBLE in nav                            HIDDEN from nav
  [→ Flow 4]                                [→ Standard user view]

─────────────────────────────────────────────────────────────
SESSION EXPIRY PATH (US-002)
─────────────────────────────────────────────────────────────

  Any authenticated page
         │
         │ User makes API request
         │ JWT expired on server
         ▼
  ┌──────────────────────────┐
  │ 401 returned by backend  │
  │ UI intercepts response   │
  └─────────────┬────────────┘
                │
                ▼
  ┌──────────────────────────┐
  │ Redirect to /login       │
  │ Toast: "Session expired  │
  │  — please log in again"  │
  │ All stale cookies cleared│
  └──────────────────────────┘

─────────────────────────────────────────────────────────────
LOGOUT PATH (US-002)
─────────────────────────────────────────────────────────────

  Authenticated user
         │
         │ Clicks Logout (nav bar)
         ▼
  ┌──────────────────────────┐
  │ POST /api/v1/auth/logout │
  │ JWT jti → Redis blocklist│
  │ HttpOnly cookie cleared  │
  └─────────────┬────────────┘
                │
                ▼
  ┌──────────────────────────┐
  │ Redirect to /login       │
  │ No token in browser      │
  └──────────────────────────┘
```

**Accessibility Notes (WCAG 2.1 AA — US-001 AC):**
- All form inputs have associated `<label>` elements
- Error messages injected into a `role="alert"` region (announced immediately)
- Submit button: `<button type="submit">` with visible label "Log In"
- Password field: `type="password"`, not `autocomplete="off"` (allow password managers)
- Lockout message must be announced by screen reader via `aria-live="assertive"`
- Minimum touch target: 44px (BL11)
- Color contrast: teal `#00C2CB` on white meets AA for large text; error `#E74C3C` meets AA

---

## Flow 2: Role Enforcement & Access Control
**Features:** F-01.2 | **Stories:** US-003, US-004
**Screens:** IMS nav (all), 403 `/403`

```
  User authenticates (→ Flow 1)
         │
         ▼
  ┌──────────────────────────────────────────────────────────┐
  │ Role decoded from JWT claims server-side on every request │
  └───────────────────┬──────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
    role = ADMIN            role = STANDARD
          │                       │
          ▼                       ▼
  Administration menu      Administration menu
  item present in DOM      NOT in DOM
          │                       │
          │                 User tries direct URL:
          │                 /admin/* or any admin API
          │                       │
          │                       ▼
          │               ┌────────────────────┐
          │               │  403 Forbidden page │
          │               │  [EP-01 · F-01.2]  │
          │               │                    │
          │               │  h1: "Access Denied"│
          │               │  "You don't have    │
          │               │   permission to     │
          │               │   access this page."│
          │               │                    │
          │               │  [ Return to Home ] │
          │               └────────────────────┘
          │
          ▼
  Admin clicks any /admin/* route → Allowed
  Server re-validates role on every request independently
          │
          │ If role changed to STANDARD mid-session:
          ▼
  ┌──────────────────────────┐
  │ Next API call → 403      │
  │ Admin menu hidden on     │
  │ next navigation render   │
  └──────────────────────────┘
```

**Accessibility Notes (WCAG 2.1 AA — US-004 AC):**
- 403 page: `<h1>Access Denied</h1>` — single H1, not nested
- "Return to Home" link: visible focus ring, keyboard-focusable, descriptive link text
- `<nav>` landmark wraps all primary navigation; Administration menu item `aria-label="Administration"`
- Server-side enforcement means DOM manipulation cannot bypass role gating

---

## Flow 3: Organization Management
**Features:** F-01.3 | **Stories:** US-005, US-006
**Screen:** Organization Management `/admin/organizations`

```
  Admin in IMS
         │
         │ Administration menu → "Organizations"
         ▼
  ┌─────────────────────────────────────────┐
  │ Organization Management                 │
  │ [EP-01 · F-01.3]  /admin/organizations │
  │                                         │
  │ ┌─────────────────────────────────┐    │
  │ │ [ + New Organization ]          │    │
  │ ├─────────────────────────────────┤    │
  │ │ Org Name   Address   Phone  [⋮] │    │
  │ │ the client  123 Main  555-…  [⋮] │    │
  │ └─────────────────────────────────┘    │
  └──────────────┬──────────────────────────┘
                 │
        ┌────────┴────────────────────────┐
        ▼                                 ▼
  [ + New Organization ]            Row action [⋮]
        │                                 │
        ▼                       ┌─────────┴─────────┐
  ┌───────────────────┐         ▼                   ▼
  │ Create Org Modal  │      [ Edit ]           [ Delete ]
  │                   │         │                   │
  │ Name*  _________  │         ▼                   ▼
  │ Address _________  │   Edit Modal          Confirm dialog:
  │ Phone  _________  │   (same fields,       "Delete this org?"
  │                   │    pre-populated)      [ Confirm ] [ Cancel ]
  │ [ Save ] [ Cancel]│         │                   │
  └────────┬──────────┘         │               Confirmed:
           │                    │               Soft-delete record
    ┌──────┴──────┐             │               Org removed from list
    ▼             ▼             ▼
  Valid       Name blank   Saved → list
  → saved     → "Organization  updates
  → list      name is       immediately
  updates     required"
```

**User-org assignment path (US-006):**
```
  Admin on Organizations page
         │
         │ Opens org record detail
         ▼
  ┌──────────────────────────────┐
  │ Org Detail — Users tab       │
  │ [EP-01 · F-01.3]            │
  │                              │
  │ Assigned users list          │
  │ [ + Assign User ]            │
  └───────────────┬──────────────┘
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
  Select user           Remove user
  from search           from org
  dropdown              → Confirm dialog
       │                     │
       ▼                     ▼
  User assigned         Assignment removed
  → appears in list     → removed from list
```

**Accessibility Notes (WCAG 2.1 AA — US-005 AC):**
- All form inputs: programmatically associated `<label>`; `aria-required="true"` on Name field
- Modal: `role="dialog"` with `aria-modal="true"`, `aria-labelledby` pointing to modal heading
- Focus trap inside modal; focus returns to trigger button on close
- Delete confirm dialog: focus moves to "Confirm" button on open; Escape cancels
- Table: `<th scope="col">` for column headers; row actions labelled `aria-label="Actions for {org name}"`

---

## Flow 4: IMS Navigation & Tab System
**Features:** F-01.4 | **Stories:** US-007, US-008
**Screen:** All IMS screens (nav bar persistent)

```
  Admin authenticated (role = ADMIN)
         │
         ▼
  ┌────────────────────────────────────────────────────────┐
  │  IMS Top Navigation Bar                               │
  │  [EP-01 · F-01.4]                                     │
  │                                                        │
  │  [Logo]  [Home]  [Administration ▾]  [User] [Logout]  │
  └─────────────────────┬──────────────────────────────────┘
                        │
              Admin clicks "Administration"
                        │
                        ▼
  ┌────────────────────────────────┐
  │ Dropdown Menu                  │
  │ ─────────────────────────────  │
  │  Driver Check In Set Up        │
  │  Organizations                 │
  │  (other future items)          │
  └──────────────┬─────────────────┘
                 │
     ┌───────────┴───────────────────┐
     ▼                               ▼
"Driver Check In Set Up"        "Organizations"
     │                               │
     ▼                               ▼
Opens new IMS tab              Opens new IMS tab
Tab title:                      Tab title:
"Driver Check In Admin"         "Organizations"
Route: /admin/driver-checkin    Route: /admin/organizations
[→ Flow 5]                      [→ Flow 3]

─────────────────────────────────────────────────────────────
TAB MANAGEMENT
─────────────────────────────────────────────────────────────

  Multiple tabs open
         │
         │ Click tab header → switch to that tab
         │ Click [×] on tab → close tab
         │ Close last tab → return to IMS home
         ▼
  ┌────────────────────────────────────────────────────────┐
  │  [Driver Check In Admin ×]  [Organizations ×]  [+]    │
  └────────────────────────────────────────────────────────┘
```

**Accessibility Notes (WCAG 2.1 AA — US-007 AC):**
- Navigation dropdown: `role="menu"` with `aria-haspopup="true"` on trigger button
- Menu items: `role="menuitem"` with keyboard navigation (Arrow keys, Enter, Escape)
- Tab bar: `role="tablist"` with `role="tab"` items; `aria-selected="true"` on active tab
- Close button on tab: `aria-label="Close Driver Check In Admin tab"`
- Administration menu toggle: `aria-expanded="true/false"` updated on open/close

---

## Flow 5: Settings Page Load & Display
**Features:** F-02.1, F-02.3 | **Stories:** US-009, US-015
**Screen:** Driver Check In Admin `/admin/driver-checkin`

```
  Admin opens Driver Check In Set Up (→ Flow 4)
         │
         ▼
  ┌──────────────────────────────────────────────┐
  │ GET /api/v1/driver-checkin/settings          │
  │ (org_id from JWT, X-Organization-Id header)  │
  └───────────────────┬──────────────────────────┘
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
    API in-flight           API returns
           │                     │
           ▼              ┌──────┴──────────────┐
  ┌─────────────────┐     ▼                     ▼
  │ Loading state:  │  Settings exist       Empty set
  │ Skeleton rows   │  (existing org)       (new org)
  │ for each        │      │                    │
  │ setting slot    │      ▼                    ▼
  └─────────────────┘  Populate         All toggles default
                       all 10 rows      OFF, fields empty
                           │            aria-live="polite":
                           │            "No settings
                           │             configured yet"
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ Driver Check In Admin — Settings Page                        │
  │ [EP-02 · F-02.1]  /admin/driver-checkin                     │
  │                                                              │
  │  Setting Name              Toggle    Input / Action          │
  │  ─────────────────────────────────────────────────────────  │
  │  Organization Name         [ON 🔒]   [the organization    ]  │
  │  QR Code Check In Access   [ON  ]    [ Generate QR Code ]   │
  │  Driver Name               [ON 🔒]   —                      │
  │  Driver ID                 [ON  ]    —                       │
  │  Driver Phone Number       [ON 🔒]   —                       │
  │  Truck Number              [ON 🔒]   —                       │
  │  Carrier Approval Step     [OFF ]    —                       │
  │  Temperature Acknowledgement [OFF]   —                       │
  │  Early Check In Step       [OFF ]    —                       │
  │  Confirmation Step         [ON  ]    [Driver Check In is…]  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

Legend:  [ON 🔒] = Toggle ON, locked (not editable)
         [ON  ]  = Toggle ON, editable
         [OFF ]  = Toggle OFF, editable
```

**Accessibility Notes (WCAG 2.1 AA — US-009 AC):**
- Settings list: structured as a `<table>` or `role="grid"` with column headers
- Loading skeleton: `aria-busy="true"` on container; `aria-label="Loading settings"`
- Locked toggles: `aria-disabled="true"` + `aria-checked="true"`; visually distinct (greyed switch)
- `aria-live="polite"` region at top of settings area for async state announcements
- Page `<h1>`: "Driver Check In Admin" — single H1 per page

---

## Flow 6: Toggle a Setting (Core Flow)
**Features:** F-02.1, F-02.4 | **Stories:** US-010, US-016, US-017, US-018
**Screen:** Driver Check In Admin `/admin/driver-checkin`

```
  Admin on Settings Page
         │
         │ Identifies a non-locked toggle (e.g., Driver ID, Carrier Approval)
         │ Clicks toggle (or keyboard: Tab to toggle, Space to activate)
         ▼
  ┌────────────────────────────────────────────┐
  │ Optimistic UI update                       │
  │ Toggle switches state immediately          │
  │ Screen reader: announces new state         │
  │ "Driver ID, toggle, [on/off]"              │
  └────────────────────┬───────────────────────┘
                       │
                       ▼
  ┌────────────────────────────────────────────┐
  │ PUT /api/v1/driver-checkin/settings/:id    │
  │ Body: { toggle_state: true/false,          │
  │          version_num: <current> }          │
  └────────────────────┬───────────────────────┘
                       │
             ┌─────────┴──────────┐
             ▼                    ▼
        200 OK               Error (4xx/5xx)
             │                    │
             ▼                    ▼
  ┌─────────────────┐   ┌──────────────────────────┐
  │ Toggle state    │   │ Toggle REVERTS to prior  │
  │ confirmed       │   │ state (optimistic undo)  │
  │ VERSION_NUM     │   │                          │
  │ updated         │   │ Inline error below row:  │
  │                 │   │ "Failed to save. Retry?" │
  │ If toggle → ON  │   │ [ Retry ] button          │
  │ and setting has │   └──────────────────────────┘
  │ an input field: │
  │ input enabled   │
  │                 │
  │ If toggle → OFF │
  │ and setting has │
  │ an input field: │
  │ input disabled  │
  │ validation skip │
  └─────────────────┘

─────────────────────────────────────────────────────────────
LOCKED TOGGLE PATH (Organization Name, Driver Name, Phone, Truck)
─────────────────────────────────────────────────────────────

  Admin views locked toggle row
         │
         │ Attempts to interact
         ▼
  Toggle does not respond (aria-disabled="true")
  No API call made
  Visual: toggle greyed, cursor: not-allowed
```

**Decision: Which toggles are locked?**
- Locked ON (cannot change): Organization Name, Driver Name, Driver Phone Number, Truck Number
- Editable: Driver ID, Carrier Approval Step, QR Code Check In Access, Temperature Acknowledgement, Early Check In Step, Confirmation Step

**Accessibility Notes (WCAG 2.1 AA — US-017 AC):**
- Each toggle: `role="switch"` with `aria-checked="true/false"`
- Toggle accessible name matches visible label (e.g., `aria-label="Driver ID"`)
- Driver identity section grouped: `role="group"` + `aria-label="Driver Identity Settings"`
- Locked toggles: `aria-disabled="true"`, tooltip or visually hidden text explaining "This setting is always enabled"
- Inline error: `role="alert"` — announced immediately to screen readers

---

## Flow 7: Auto-Save & Validation (Input Field)
**Features:** F-02.2, F-02.5 | **Stories:** US-011, US-012, US-013, US-019
**Screen:** Driver Check In Admin `/admin/driver-checkin`

```
  Admin on Settings Page
  Toggle is ON for a setting with an input field
  (e.g., Temperature Acknowledgement, Early Check In hours,
   Confirmation Step text)
         │
         │ Admin types into input field
         │
         │ Admin moves focus away (blur / Tab out)
         ▼
  ┌──────────────────────────────────────────────┐
  │ Validation runs client-side (< 200ms target) │
  └─────────────────────┬────────────────────────┘
                        │
          ┌─────────────┼──────────────────┐
          ▼             ▼                  ▼
       Empty        Non-numeric        Invalid
     (required)    (hours field)        format
          │             │                  │
          ▼             ▼                  ▼
   "A value is    "Numbers only"    "Invalid format"
    required"          │                  │
          │            └──────────────────┘
          │                  │
          │   Error displayed inline below field
          │   in Error color #E74C3C
          │   role="alert" announced immediately
          │   NO API call made
          │
          ▼
       Valid input
          │
          ▼
  ┌──────────────────────────────────────────────┐
  │ PUT /api/v1/driver-checkin/settings/:id      │
  │ Body: { input_value: "…",                    │
  │          version_num: <current> }            │
  └─────────────────────┬────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
       200 OK (< 2s)           Error (4xx/5xx)
            │                       │
            ▼                       ▼
  ┌──────────────────┐   ┌────────────────────────┐
  │ Save indicator:  │   │ Error toast displayed  │
  │ ✓ checkmark      │   │ "Save failed. Retry?"  │
  │ visible briefly  │   │ [ Retry ]               │
  │ (1.5s), then     │   │ Input value preserved  │
  │ fades out        │   │ (not reverted)         │
  └──────────────────┘   └────────────────────────┘

─────────────────────────────────────────────────────────────
HELP TEXT DISPLAY (US-019)
─────────────────────────────────────────────────────────────

  Setting row with help text configured
         │
         ▼
  Help text appears below field label
  Muted italic style (Neutral-500, Inter font)
  Linked to input via aria-describedby="help-{setting-id}"
         │
         │ Help text > 200 characters?
         ▼
  ┌────────────────────────────────┐
  │ Truncated to 200 chars         │
  │ "Add the Temperature req…"     │
  │ [ Read more ]                  │
  └──────────────┬─────────────────┘
                 │
         User clicks / activates "Read more"
                 │
                 ▼
  ┌────────────────────────────────┐
  │ Full text expands inline       │
  │ Link text changes to           │
  │ "Show less"                    │
  │ Focus remains on link          │
  └────────────────────────────────┘
```

**Accessibility Notes (WCAG 2.1 AA — US-011, US-019 AC):**
- Validation errors: `role="alert"` + `aria-describedby` links error to field
- Save indicator (✓): `aria-live="polite"` region — "Changes saved" announced non-intrusively
- Help text: `id="help-{setting-id}"` referenced by input's `aria-describedby`
- "Read more" / "Show less": focus stays on link after expand; `aria-expanded="true/false"`
- Input fields when toggle is OFF: `disabled` attribute + `aria-disabled="true"`; visually greyed

---

## Flow 8: Advanced Settings — Temperature, Early Check In, Confirmation
**Features:** F-03.1, F-03.2, F-03.3 | **Stories:** EP-03 scope
**Screen:** Driver Check In Admin `/admin/driver-checkin` (Sprint 3 — all 10 settings visible)

```
─────────────────────────────────────────────────────────────
TEMPERATURE ACKNOWLEDGEMENT (F-03.1)
─────────────────────────────────────────────────────────────

  Settings page — Temperature Acknowledgement row
  Default: Toggle OFF, input disabled
         │
         │ Admin toggles ON
         ▼
  ┌──────────────────────────────────────────────┐
  │ Temperature Range Requirements input ENABLED │
  │ Placeholder: "e.g. 34°F – 40°F"             │
  │ Help text: "Add the Temperature requirements │
  │  to display during Check In via mobile app…" │
  └─────────────────────┬────────────────────────┘
                        │
                        │ Admin enters value, tabs out
                        │
          ┌─────────────┴──────────────┐
          ▼                            ▼
    Valid alphanumeric           Invalid format
          │                      (e.g., only symbols)
          ▼                            │
    Auto-save → ✓              "Invalid format" error
                                No save until corrected

─────────────────────────────────────────────────────────────
EARLY CHECK IN STEP (F-03.2) — Two input fields
─────────────────────────────────────────────────────────────

  Settings page — Early Check In Step row
  Default: Toggle OFF, both inputs disabled
         │
         │ Admin toggles ON
         ▼
  ┌──────────────────────────────────────────────────────┐
  │ Field 1: Allowed Early Hours                         │
  │ Input type: number  Default: empty                   │
  │ Validation: "Numbers only"                           │
  │ Required when toggle ON                              │
  │ Help text: "Enter the number of hours…"              │
  │                                                      │
  │ Field 2: Early Check In Instruction                  │
  │ Input type: textarea  Required when toggle ON        │
  │ Default: "Due to earlier arrival time…              │
  │  {TRAFFIC_CLERK_PHONE}"                             │
  │ Help text: "Customize the message shown…"           │
  └──────────────────┬───────────────────────────────────┘
                     │
         Each field auto-saves independently on blur
                     │
          ┌──────────┴──────────────────┐
          ▼                             ▼
    Valid → save → ✓            Empty / non-numeric
                                → inline error
                                → no save

─────────────────────────────────────────────────────────────
CONFIRMATION STEP (F-03.3)
─────────────────────────────────────────────────────────────

  Settings page — Confirmation Step row
  Default: Toggle ON, input ENABLED with default text
         │
  ┌──────┴────────────────────────────────────────────┐
  │ Confirmation Text input                           │
  │ Default: "Driver Check In is successfully         │
  │  completed! [full default message]"              │
  │ Admin can customize                               │
  └──────────────┬────────────────────────────────────┘
                 │
         ┌───────┴───────────────┐
         ▼                       ▼
   Toggle remains ON       Admin toggles OFF
   Input editable           │
   Auto-save on blur        ▼
                      Input disabled
                      Validation skipped
                      Mobile app: no
                      confirmation step shown
```

**Accessibility Notes (WCAG 2.1 AA):**
- Multi-field settings (Early Check In): each field independently labelled with `<label>`; group wrapped in `<fieldset>` + `<legend>` "Early Check In Step"
- `{TRAFFIC_CLERK_PHONE}` placeholder text: help text explains this is a dynamic variable; announced via `aria-describedby`
- Textarea: `aria-multiline="true"` announced by screen reader automatically; `rows` attribute set for visible height
- Required fields when toggle is ON: `aria-required="true"` added dynamically on toggle

---

## Flow 9: QR Code Generation, Download & Print
**Features:** F-04.1, F-04.2, F-04.3 | **Stories:** EP-04 scope
**Screens:** Driver Check In Admin `/admin/driver-checkin` → QR Code Modal (overlay)

```
  Admin on Settings Page
  Locates "QR Code Check In Access" setting row
         │
         │ Clicks [ Generate QR Code ] button
         │ (button always active regardless of toggle state)
         ▼
  ┌──────────────────────────────────────────────┐
  │ POST /api/v1/driver-checkin/qr-code          │
  │ org_id from JWT                              │
  │ Backend: python qrcode generates PNG         │
  └─────────────────────┬────────────────────────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        Success                  Error
             │                     │
             ▼                     ▼
  ┌──────────────────────┐   ┌──────────────────────┐
  │ QR Code Modal opens  │   │ Error toast:         │
  │ [EP-04 · F-04.1]    │   │ "QR generation       │
  │                      │   │  failed. Try again." │
  │ Title:               │   └──────────────────────┘
  │ "QR Code for         │
  │ {ORG_NAME}           │
  │ Driver Check In      │
  │ Access"             │
  │                      │
  │  ┌────────────────┐  │
  │  │  [QR Image]    │  │
  │  │  256×256px     │  │
  │  └────────────────┘  │
  │                      │
  │ [ Save as PDF ]      │
  │ [ Print ]            │
  │ [ Close ]            │
  └──────────┬─────────── ┘
             │
      ┌──────┴────────────────────────────┐
      ▼               ▼                  ▼
  Save as PDF       Print            Close
      │               │                  │
      ▼               ▼                  ▼
  GET /qr-code    window.print()    Modal dismissed
  endpoint        print-optimized   Focus returns to
  returns PDF     layout triggered  Generate button
  auto-download   System print
  to browser      dialog opens
  filename:       (browser native)
  "QR-{ORG}-
  checkin.pdf"
```

**Modal behavior detail:**
```
  Modal opens
       │
       ├─ Focus trapped inside modal
       ├─ Escape key → Close (same as Close button)
       ├─ First focus target: modal heading or first button
       └─ Scroll lock on background content

  Modal closes
       │
       └─ Focus returns to "Generate QR Code" button
```

**Accessibility Notes (WCAG 2.1 AA — F-04.1 AC):**
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`
- Modal title: `id="modal-title"` — "QR Code for {ORG_NAME} Driver Check In Access"
- QR image: `alt="QR code for {ORG_NAME} Driver Check In — scan to access mobile check-in"`
- Focus trap: Tab cycles through Save as PDF, Print, Close; Shift+Tab reverses
- Close button: `aria-label="Close QR code modal"` (icon-only button must have aria-label)
- Buttons: minimum 44px touch target (BL11)
- Background: `aria-hidden="true"` applied to page content while modal is open

---

## Flow 10: Mobile App Settings Consumption
**Features:** F-05.1 | **Stories:** EP-05 scope
**Actor:** Driver Mobile App (System) | **Sprint:** 4

```
  Driver opens mobile check-in app
  (mobile app — not part of this module's UI)
         │
         │ App authenticates with mobile token
         │ (aud=mobile claim, separate from admin JWT)
         ▼
  ┌──────────────────────────────────────────────┐
  │ GET /api/v1/driver-checkin/settings/mobile   │
  │ Header: Authorization: Bearer <mobile-token> │
  │ org_id derived from token                   │
  └─────────────────────┬────────────────────────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
          200 OK              401 / 403
             │                     │
             ▼                     ▼
  Returns ONLY settings        Mobile app
  where toggle = ON            handles auth error
  (filtered projection)        Re-auth / show error
  { setting_name,
    toggle_state: true,
    input_value }
             │
             ▼
  Mobile app renders check-in
  flow with only enabled settings:
  ─────────────────────────────
  ✓ Organization Name → shown
  ✓ Driver Name → shown (if ON)
  ✓ Driver ID → shown (if ON)
  ✓ Temperature Acknowledgement → shown with value (if ON)
  ✗ Early Check In → hidden (if OFF)
  ✓ Confirmation Step → shown with custom text (if ON)
  … etc.

─────────────────────────────────────────────────────────────
ADMIN TOGGLE → MOBILE SYNC
─────────────────────────────────────────────────────────────

  Admin toggles setting OFF on admin page (→ Flow 6)
         │
         │ Setting persisted to DB with toggle_state = false
         │
         │ Next mobile API call (TTL: 30s cache)
         ▼
  Setting ABSENT from mobile API response
  Mobile app hides that field from check-in flow
```

---

## Flow 11: Error Recovery — Save Failure
**Features:** F-05.3 | **Stories:** EP-05 scope
**Screen:** Driver Check In Admin `/admin/driver-checkin`

```
  Admin interacts with setting (toggle or input)
  Auto-save triggered
         │
         │ API call fails (network error, 5xx)
         ▼
  ┌───────────────────────────────────────────────┐
  │ Error handling behavior                        │
  │                                               │
  │ Toggle failure:                               │
  │   → Toggle REVERTS to prior state             │
  │   → Inline error below row:                   │
  │     "Failed to save. Retry?"                  │
  │     [ Retry ] button                          │
  │                                               │
  │ Input save failure:                           │
  │   → Input value PRESERVED (not reverted)      │
  │   → Toast notification:                       │
  │     "Save failed — changes not persisted"     │
  │     [ Retry ] button in toast                 │
  └──────────────────────┬────────────────────────┘
                         │
                 Admin clicks [ Retry ]
                         │
                         ▼
  ┌───────────────────────────────────────────────┐
  │ Re-attempt PUT request                        │
  │ Same payload + current version_num            │
  └──────────────────────┬────────────────────────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
         Success                 Failure again
             │                       │
             ▼                       ▼
  Error cleared               Persistent error:
  ✓ indicator shown           "Unable to save.
                               Check connection."
                               (manual retry available)

─────────────────────────────────────────────────────────────
NETWORK OFFLINE PATH (EP-05)
─────────────────────────────────────────────────────────────

  Admin loses network connection
         │
         │ Save attempt made
         ▼
  ┌───────────────────────────────────────────────┐
  │ Changes queued client-side                    │
  │ Status indicator: "Offline — changes queued"  │
  └──────────────────────┬────────────────────────┘
                         │
         Network reconnects
                         │
                         ▼
  ┌───────────────────────────────────────────────┐
  │ Queued saves flushed in order                 │
  │ Status: "Syncing…" → "All changes saved"     │
  └───────────────────────────────────────────────┘
```

**Accessibility Notes (WCAG 2.1 AA — F-05.3 AC):**
- Error toast: `role="alert"` — screen reader announces immediately
- Retry button in toast: `aria-label="Retry saving {setting name}"`
- Offline indicator: `aria-live="polite"` region at page top; updated on connect/disconnect
- "All changes saved" confirmation: `aria-live="polite"` — non-intrusive announcement

---

## Flow 12: End-to-End Admin Journey (Composite)
**Epics:** EP-01 through EP-05 | **Actor:** Admin IMS User

This flow shows the complete journey for a new admin configuring a new organization from first login through full settings configuration and QR code deployment.

```
START: Admin receives IMS credentials
         │
         ▼
   ┌────────────┐
   │  /login    │  ← Flow 1
   │ Log in     │
   └─────┬──────┘
         │
         ▼
   IMS Main Page
   Administration menu visible (ADMIN role)
         │
         │ Administration → Organizations
         ▼
   ┌─────────────────┐
   │ Organizations   │  ← Flow 3
   │ Create new org  │
   │ Name, address,  │
   │ phone saved     │
   └────────┬────────┘
            │
            │ Administration → Driver Check In Set Up
            ▼
   ┌─────────────────┐
   │ New IMS tab    │  ← Flow 4
   │ "Driver Check   │
   │  In Admin"      │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────────────────────┐
   │ Settings Page loads             │  ← Flow 5
   │ 10 settings with defaults       │
   │ New org: all OFF + locked rows  │
   └────────┬────────────────────────┘
            │
            │ Admin reviews each setting:
            ▼
   ┌─────────────────────────────────┐
   │ Configures Driver Identity      │  ← Flow 6
   │ Toggles Driver ID → ON         │
   │ Toggles Carrier Approval → ON  │
   └────────┬────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────┐
   │ Configures Temperature          │  ← Flows 7, 8
   │ Toggles ON → enters range       │
   │ "34°F – 40°F" → auto-save ✓    │
   └────────┬────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────┐
   │ Configures Early Check In       │  ← Flow 8
   │ Toggles ON                      │
   │ Hours: "2" → auto-save ✓        │
   │ Instruction: customized → ✓     │
   └────────┬────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────┐
   │ Confirmation Step               │  ← Flow 8
   │ Already ON with default text    │
   │ Customizes message → ✓          │
   └────────┬────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────┐
   │ Generates QR Code               │  ← Flow 9
   │ [ Generate QR Code ] clicked    │
   │ Modal opens with QR image       │
   │ Saves PDF → downloads           │
   │ Sends/posts to facility         │
   └────────┬────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────┐
   │ Drivers scan QR at facility     │  ← Flow 10 (mobile, out of scope)
   │ Mobile app fetches settings     │
   │ Check-in flow uses admin config │
   └─────────────────────────────────┘

END: Facility operational with configured Driver Check In
```

---

## Screen ↔ Flow Traceability Matrix

| Screen | Route | Epic | Flow(s) | Sprint | Stories |
|--------|-------|------|---------|--------|---------|
| Login | `/login` | EP-01 | 1 | 1 | US-001, US-002 |
| 403 Forbidden | `/403` | EP-01 | 2 | 1 | US-004 |
| Organization Management | `/admin/organizations` | EP-01 | 3 | 1 | US-005, US-006 |
| IMS Nav + Tab Bar | (persistent) | EP-01 | 4 | 1 | US-007, US-008 |
| Driver Check In Admin — Settings | `/admin/driver-checkin` | EP-02–04 | 5, 6, 7, 8, 9, 11 | 2–3 | US-009–019 + EP-03/04 |
| QR Code Modal | (overlay on `/admin/driver-checkin`) | EP-04 | 9 | 3 | EP-04 scope |
| Mobile Settings API | (API only, no admin UI) | EP-05 | 10 | 4 | EP-05 scope |

---

## Accessibility Summary (All Screens)

| Requirement | Implementation | Applicable Screens |
|-------------|---------------|-------------------|
| WCAG 2.1 AA color contrast | Primary `#00C2CB` meets AA for large text; body text on white meets AA | All |
| Keyboard navigation | All interactive elements Tab-accessible; no mouse-only interactions | All |
| Focus management | Modal focus trap; focus returns to trigger on close; skip-to-main link | All |
| Screen reader announcements | `aria-live="polite"` for saves/status; `role="alert"` for errors | Settings, Login |
| Minimum touch target | 44px (BL11 design token) on all buttons, toggles, links | All |
| Semantic HTML | Proper heading hierarchy (H1→H2); landmark regions (`<nav>`, `<main>`, `<header>`) | All |
| Form accessibility | `<label>` associations; `aria-required`; `aria-describedby` for help/error | Login, Org Mgmt, Settings |
| Toggle / switch | `role="switch"` + `aria-checked`; locked: `aria-disabled="true"` | Settings |
| Table structure | `<th scope="col">` headers; row actions labelled with org/setting context | Org Mgmt, Settings |
| Dynamic content | Skeleton loaders: `aria-busy="true"`; content change: `aria-live` | Settings |
| Audit (Sprint 4) | Full axe-core + Playwright WCAG 2.1 AA audit; zero violations gate for v1.0 | All |

> **Note:** This is an internal admin web application. FLAG_SECURE (mobile screen capture prevention) and financial disclosure requirements (PD22, PD5 PCCI) do not apply to this module. No financial data is collected or displayed. No sensitive data is exposed to end consumers.
