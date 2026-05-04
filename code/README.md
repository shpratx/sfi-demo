# The Hive — Driver Check-In Admin

A full-stack web application for managing driver check-in workflows, built for the Schreiber Foods HIVE platform.

## Tech Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Query, Zustand    |
| Backend  | Python 3.12+, FastAPI, SQLAlchemy, Pydantic v2                    |
| Database | Oracle DB (via oracledb driver)                                   |
| Cache    | Redis                                                             |
| Auth     | JWT RS256 (access + refresh tokens)                               |

## Project Structure

```
sfi-demo/code
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── pyproject.toml
│   └── app/
│       ├── api/
│       │   ├── routers/         # health, auth, organizations, settings, mobile, qr_code, audit
│       │   ├── middleware.py     # correlation-id, exception handling
│       │   └── dependencies.py  # DI for auth, DB sessions
│       ├── service/             # business logic layer
│       ├── domain/
│       │   ├── models/          # SQLAlchemy ORM models
│       │   └── schemas/         # Pydantic request/response schemas
│       ├── infrastructure/      # database engine, Redis cache
│       └── core/                # config, security, exceptions
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── pages/               # LoginPage, SettingsPage, OrganizationsPage, ForbiddenPage
│       ├── components/          # AppShell, ProtectedRoute, ErrorBoundary
│       ├── services/            # Axios API clients
│       ├── stores/              # Zustand auth store
│       ├── hooks/               # useAuth, useSettings
│       ├── types/
│       └── styles/
├── mock-server/
    └── server.mjs               # Standalone mock backend (Node.js, no deps)
```

## Prerequisites

- **Python** ≥ 3.12
- **Node.js** ≥ 18 (with npm)
- **Oracle Database** (or Oracle Free container)
- **Redis**

## Getting Started

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Create .env file (see Environment Variables below)
cp .env.example .env   # or create manually

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend

# Install dependencies (skip if node_modules exists)
npm install

# Start dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`. API calls to `/api/*` are proxied to the backend on port 8000.

## Running with the Mock Server (no DB/Redis required)

A standalone mock backend is included for frontend development without Oracle DB, Redis, or Python dependencies. It uses only Node.js built-in modules.

```bash
# Terminal 1 — start mock backend on port 8000
node mock-server/server.mjs

# Terminal 2 — start frontend
cd frontend
npm run dev
```

The mock server provides all API routes with realistic seed data:
- **Auth:** any email/password combination will log in as a Demo Admin
- **Settings:** 10 pre-seeded driver check-in settings with correct toggle/input states
- **Organizations:** 2 sample orgs (Green Bay, Logan)
- **QR Code:** returns a placeholder PNG and PDF
- **Audit:** 3 sample audit log entries

Open `http://localhost:5173` and log in with any credentials.

## Environment Variables

Create a `backend/.env` file:

```env
APP_NAME=driver-checkin-service
DEBUG=true

# Oracle DB
DB_USER=app_user
DB_PASSWORD=changeme
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=FREEPDB1

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT RS256 keys (PEM format, newlines as \n)
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
JWT_ACCESS_EXPIRE_MINUTES=30
JWT_REFRESH_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

## API Routes

All backend routes are prefixed with `/api/v1`:

| Route              | Description                    |
| ------------------ | ------------------------------ |
| `/health`          | Health check                   |
| `/auth`            | Login, token refresh           |
| `/organizations`   | Organization CRUD              |
| `/settings`        | Driver check-in settings       |
| `/mobile`          | Mobile driver endpoints        |
| `/qr-code`         | QR code generation             |
| `/audit`           | Audit log queries              |

## Scripts

### Backend

```bash
pytest                    # Run tests
pytest --cov=app          # Run tests with coverage
ruff check app/           # Lint
black app/                # Format
mypy app/                 # Type check
```

### Frontend

```bash
npm run dev               # Start dev server
npm run build             # Type-check + production build
npm run lint              # ESLint
npm run typecheck         # TypeScript check only
npm run test              # Run Vitest
npm run test:coverage     # Run tests with coverage
```
