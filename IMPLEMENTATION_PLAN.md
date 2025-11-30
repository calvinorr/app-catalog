# App Catalog – Execution Plan

This aligns the current Vite mock UI with the PRD (`PRD-App-Catalog.md`). Ordered by dependency and impact.

## 1) Platform Alignment
- Decide: migrate to Next.js (as per PRD) or keep Vite for UI-only prototype. Recommendation: start a Next.js App Router project to host API routes and shadcn/ui.
- Set up Turso + Drizzle in the Next.js app; add schema for `projects`, `tech_stack_snapshots`, `activity_items`.

## 2) Data Ingest
- Build `scripts/scan-projects.ts` (Node/TS) to scan `/Users/calvinorr/Dev/Projects`, detect frameworks/DB/auth/configs, and POST to `/api/ingest/projects`.
- Add `scan-config.json` for root path and API URL; keep tokens out of git.
- Implement `/api/ingest/projects` to upsert projects and tech snapshots.

## 3) Activity Refresh
- Add `/api/refresh-activity` endpoint to pull latest commit (GitHub PAT) and deployment (Vercel token) per project; write to `activity_items`.
- Store and display “last refreshed” timestamp; fail soft if APIs unavailable.

## 4) UI Wiring
- Replace mock `data.ts` with live data from `/api/projects`.
- Add status filter (active/redundant), toggle control on cards/detail, and live activity timeline.
- Use shadcn/ui components to match PRD visuals.

## 5) CI/CD & Tooling
- Keep current GitHub Actions (install + build); extend with lint/tests once added.
- Add linting/formatting (eslint/prettier) and type checks in CI when available.

## Milestones
- MVP: Next.js app with schema, ingest endpoint, scanner posting real data, basic dashboard rendering DB records.
- v1: Activity refresh integration, status toggles, filters/search/sort backed by DB, deployment-ready on Vercel + Turso.
