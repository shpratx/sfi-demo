# Driver Check In Admin — Demo

FastAPI backend + React frontend covering the major flows in `hive-user-flows.md`.

## Run

```bash
# backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173.

## Demo accounts

- `admin@schreiber.com` / `admin` → ADMIN
- `user@schreiber.com` / `user` → STANDARD (will hit 403 on admin pages)

## Flows implemented

| Flow | Screen | Route |
|---|---|---|
| 1 — Login & session | Login | `/login` |
| 2 — Role enforcement / 403 | Forbidden | `/403` |
| 3 — Organization Management | Orgs CRUD with create/edit modal & confirm delete | `/admin/organizations` |
| 4 — HIVE nav + tabs | Top nav, Administration dropdown, multi-tab bar | (persistent) |
| 5–9, 11 — Settings (load, toggle, validate, advanced, QR, errors) | Driver Check In Admin | `/admin/driver-checkin` |
| 10 — Mobile settings consumption | Mobile preview (phone frame, walks driver through enabled steps only) | `/mobile` |
| 12 — End-to-end journey | Drive it: log in → orgs → settings → mobile preview | — |

The mobile preview reads `GET /api/mobile/settings`, which only returns the *enabled* steps — toggle something off in admin, click "Reload Settings" in the phone frame, and the step disappears.

## API

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | bearer |
| GET  | `/api/auth/me` | bearer |
| GET / POST / PUT / DELETE | `/api/organizations[/{id}]` | admin |
| GET / PUT / PATCH | `/api/settings` | admin |
| POST | `/api/validate` | public |
| POST | `/api/qrcode` | admin |
| GET  | `/api/mobile/settings` | public (mobile-token in real impl) |

Docs at http://localhost:8000/docs.

## Simplifications vs spec

- Tokens are random opaque strings stored server-side, not real JWT/RS256 — same surface (`Authorization: Bearer …`, 401/403 semantics) but no signing or Redis blocklist.
- Lockout after 5 failed attempts is stubbed (not enforced).
- Org `Users` tab and assign/remove user paths are not implemented.
- Skeleton loaders, offline queueing, optimistic-undo error toasts simplified to plain inline errors.
- Help-text "Read more / Show less" truncation not implemented (full text shown).
- Accessibility patterns (aria-live, focus traps, etc.) are partially in place but not audited.
