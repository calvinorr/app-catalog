# App Catalogue (DevDash)

Lightweight dashboard for browsing and inspecting a catalog of personal projects. The current build is a static front-end prototype using mock data; see the PRD for the intended end-to-end system.

## Product Intent

- PRD: [`PRD-App-Catalog.md`](PRD-App-Catalog.md)
- Goals: scan local projects, infer tech stack, store metadata in Turso, surface GitHub/Vercel activity, and mark projects as `active` or `redundant` without destructive operations.

## Current State vs PRD

- UI only: dashboard + analysis views backed by mock data in `data.ts`.
- No scanning/ingest pipeline, database, or API routes yet.
- No GitHub/Vercel integrations; activity and deployments are simulated.
- Status filter/toggle works on mock data to mirror the PRD’s active/redundant concept.
- Gemini scaffolding removed; no external services or keys required.

## Next Steps to Align with PRD

1) Implement CLI scanner (`scripts/scan-projects.ts`) to walk `/Users/calvinorr/Dev/Projects` and POST to `/api/ingest/projects`.  
2) Stand up Turso + Drizzle schema (`projects`, `tech_stack_snapshots`, `activity_items`) and seed from the scanner. **(Scaffolded in `/backend`.)**  
3) Add API routes (`/api/ingest/projects`, `/api/projects`, `/api/refresh-activity`, status toggle) in a Next.js app. **(Routes scaffolded in `/backend/app/api/...`; refresh still TODO.)**  
4) Wire GitHub/Vercel refresh using personal tokens; surface last commit/deployment in the UI.  
5) Extend UI with status filter (active/redundant), redundant toggle, and real data bindings.  
6) Add a lockfile after installing dependencies to pin versions.

## Run Locally (prototype)

Prerequisites: Node.js 18+ and npm.

1) Install dependencies: `npm install`  
2) Start dev server: `npm run dev`  
3) Build: `npm run build`

### Backend (scaffold)

Located in `backend/`. To install and run:
- `npm install --prefix backend`  
- `npm run dev --prefix backend` (runs on port 3001; Vite proxy is configured to hit `http://localhost:3001/api`)
  
Environment (backend): see `backend/.env.example` for `TURSO_URL`, `TURSO_TOKEN`, `GITHUB_TOKEN`, `VERCEL_TOKEN`, `VERCEL_TEAM`.

## Utilities

- Project scan sample config: `scan-config.example.json`  
- CLI scanner (mock output or POST to API): `npm run scan` (uses `scan-config.json`)  
- Tests (detection rules + status UI logic soon): `npm test`
- Frontend API base: defaults to `/api`; override with `VITE_API_BASE` if backend runs elsewhere.

### Database & Migrations
- Turso env: `TURSO_URL`, `TURSO_TOKEN` (see `backend/.env.example`).  
- Migration SQL: `backend/drizzle/0001_init.sql` (Drizzle metadata in `backend/drizzle/meta`).  
- Generate: `npm run db:generate --prefix backend`  
- Apply: `npm run db:migrate --prefix backend` (requires Turso env)

### Activity Refresh
- Backend `/api/refresh-activity` will call GitHub (`GITHUB_TOKEN`) and Vercel (`VERCEL_TOKEN`, optional `VERCEL_TEAM`).  
- Frontend Event Log pulls `/api/activity` when available; falls back to mock deployment history otherwise.

## Structure

- `App.tsx` — main layout, dashboard vs analysis view.  
- `components/` — UI modules (cards, navigation, heatmaps, weekly focus, filters).  
- `data.ts` — mock project data and generators.  
- `types.ts` — shared types.  
- `index.html` — base document (Tailwind CDN + Inter font).  
- `vite.config.ts` — Vite config for React.
- `backend/` — Next.js + Drizzle/Turso scaffold for API routes and schema (ingest, projects, status).
