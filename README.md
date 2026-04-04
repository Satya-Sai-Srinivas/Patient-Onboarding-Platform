# Patient Onboarding — Monorepo

A full-stack, multi-platform patient check-in and queue management system for healthcare clinics.

## Repository Structure

```
Patient-Onboarding/
├── apps/
│   ├── web/          # Browser web app — kiosk check-in, clinician & admin dashboards
│   └── mobile/       # Cross-platform mobile app (Expo/React Native) — patient-facing
├── backend/          # REST + WebSocket API (FastAPI / Python)
├── package.json      # Root pnpm workspace config
├── pnpm-workspace.yaml
├── .env.example      # All environment variables documented here
├── .gitignore
└── README.md
```

### Apps at a Glance

| App | Path | Platform | Serves |
|---|---|---|---|
| **Web** | `apps/web/` | Browser | Front-desk kiosk, clinicians, admin, TV queue display |
| **Mobile** | `apps/mobile/` | iOS / Android / Web (Expo) | Patients checking in on their own device |
| **Backend** | `backend/` | Server | All clients via HTTP REST + WebSockets |

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 | Web & mobile JS runtime |
| pnpm | ≥ 8 | Monorepo package manager |
| Python | 3.11 (recommended) | Backend runtime |
| PostgreSQL | ≥ 14 | Database |
| Expo CLI | latest | Mobile development |

Install pnpm globally if you don't have it:
```bash
npm install -g pnpm
```

Install Expo CLI:
```bash
npm install -g expo-cli
```

---

## Local Setup

### 1. Clone & configure environment

```bash
# Copy the example env file and fill in your values
cp .env.example .env
```

Each app reads from its own `.env` file. After editing the root `.env.example`, copy the relevant sections:

```bash
# Web app
cp .env.example apps/web/.env
# → keep only the VITE_* variables

# Mobile app
cp .env.example apps/mobile/.env
# → keep only the EXPO_PUBLIC_* variables

# Backend
cp .env.example backend/.env
# → keep the DB_*, HOST, PORT, and feature flag variables
```

### 2. Install JavaScript dependencies

From the repository root:

```bash
pnpm install
```

This installs dependencies for both `apps/web` and `apps/mobile` in one step via pnpm workspaces.

### 3. Set up the Python backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Start PostgreSQL

Make sure a local PostgreSQL instance is running and a database exists matching your `DB_NAME` env var. You can create it with:

```bash
createdb patient_onboarding
```

---

## Running the Apps

### Backend (FastAPI)

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### Web app (Vite + React)

```bash
# From root
pnpm dev:web

# Or directly
cd apps/web
pnpm dev
```

Runs at: [http://localhost:5173](http://localhost:5173)

### Mobile app (Expo)

```bash
# From root
pnpm dev:mobile

# Or directly
cd apps/mobile
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with the Expo Go app.

---

## Web App Routes

| Path | View |
|---|---|
| `/` | Home (QR check-in landing) |
| `/phone` | Phone number entry |
| `/qr` | QR code display |
| `/success` | Check-in success |
| `/clinician-dashboard` | Clinician queue view |
| `/admin-dashboard` | Admin overview |
| `/patient-queue` | TV / waiting room display |

## Backend API Summary

| Method | Path | Description |
|---|---|---|
| POST | `/api/otp/send` | Send OTP to patient phone |
| POST | `/api/otp/verify` | Verify OTP |
| POST | `/api/checkin/qr` | QR-based check-in |
| POST | `/api/checkin/sms` | SMS-based check-in |
| GET | `/api/queue/public-display` | Public waiting room queue |
| GET | `/api/queue/clinician/{id}` | Clinician's patient queue |
| GET | `/api/dashboard` | Admin dashboard metrics |
| WS | `/ws/public-display` | Real-time public queue updates |
| WS | `/ws/clinician/{id}` | Real-time clinician queue |
| WS | `/ws/admin/{id}` | Real-time admin dashboard |

Full interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Environment Variables Reference

See [`.env.example`](.env.example) for the full list with descriptions.

Key variables:

| Variable | App | Description |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | backend | PostgreSQL connection |
| `PORT` | backend | API server port (default: 8000) |
| `VITE_API_BASE` | apps/web | Backend base URL |
| `VITE_USE_MOCK` | apps/web | Use mock data instead of real API |
| `EXPO_PUBLIC_API_URL` | apps/mobile | Backend base URL for mobile |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Vite 7, React 19, React Router 7, TanStack Query 5, Tailwind CSS 3, Radix UI |
| Mobile frontend | Expo 54, React Native 0.81, TypeScript, React Navigation 7 |
| Backend | FastAPI 0.104, SQLAlchemy 2, Pydantic v2, WebSockets, Uvicorn |
| Database | PostgreSQL (via psycopg2) |
| Package manager | pnpm (workspaces) |
