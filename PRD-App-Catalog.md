# App Catalog - Product Requirements Document

**Version:** 1.0  
**Date:** November 30, 2025  
**Owner:** Calvin Orr  
**Status:** Draft

---

## Implementation Status (2025-11-30)

- Frontend: Vite-based UI prototype (status filter/toggle, search, analysis view) with API-ready data hooks; still using mock data until DB/API are live.  
- Scanner: Node/TS CLI builds project payloads and can POST to `/api/ingest/projects` (configurable root/API URL).  
- Backend scaffold: Next.js App Router + Drizzle/Turso with tables for `projects`, `tech_stack_snapshots`, `activity_items`; API routes for ingest, list, status toggle, activity feed, and a GitHub/Vercel refresh endpoint.  
- Migrations: SQL generated (`backend/drizzle/0001_init.sql`); ready to apply to Turso when `TURSO_URL`/`TURSO_TOKEN` are provided.  
- Activity refresh: Hits GitHub (latest commit) and Vercel (latest deployment) when `GITHUB_TOKEN`/`VERCEL_TOKEN` are set; writes to `activity_items`.  
- Next steps: apply migrations to Turso, run scanner to seed real data, wire frontend to live `/api/projects`/`/api/activity`, and harden refresh error handling.

---

## Executive Summary

A single-user "App Catalog" web application that scans `/Users/calvinorr/Dev/Projects`, detects each project, and stores metadata in a Turso cloud database. The UI (Next.js + shadcn/ui) provides a clean dashboard showing all projects with inferred tech stack, GitHub/Vercel activity, and the ability to mark projects as "redundant" without deleting anything.

---

## Problem Statement

As a hobbyist developer building multiple apps and deploying to Vercel via GitHub, I need:
- A centralized view of all my local projects and their current state
- Quick tech stack summaries to remember what each project uses
- Visibility into GitHub and Vercel activity to identify stale projects
- A way to mark old experiments as "redundant" to thin out mental clutter without destructive operations

---

## Goals and Non-Goals

### Goals
- One-glance view of all local projects and their status (active vs redundant)
- Simple, deterministic tech stack summaries based on `package.json` and config files
- Basic GitHub + Vercel signals (last commit, last deployment) to identify stale projects
- Mark projects as redundant without deleting repos or Vercel deployments

### Non-Goals (v1)
- No destructive operations (no auto-deleting repos or Vercel projects)
- No complex authentication (runs on your machine only)
- No deep static analysis of code (rely on package/config inspection only)
- No monorepo support (single-app repos only)

---

## User Personas

**Primary User:** Solo hobbyist developer (you)
- Builds multiple small Next.js apps as hobby projects
- Deploys via GitHub → Vercel pipeline (one repo → one Vercel project)
- Stores local copies in `/Users/calvinorr/Dev/Projects`
- Uses various backends (Prisma, Convex, PocketBase, etc.)
- Wants to clean up and organize projects without losing anything

---

## User Stories

### Project Discovery
- As a developer, I want the app to scan `/Users/calvinorr/Dev/Projects` and list each project so I can see everything I've created
- As a developer, I want the scan to auto-detect GitHub repo and Vercel project associations so I don't have to manually configure them

### Tech Stack Visibility
- As a developer, I want each project to show a short tech stack summary (framework, database, auth) so I can remember what I used
- As a developer, I want to see key dependencies and technologies tagged (e.g., "Prisma", "Convex", "shadcn/ui") for quick filtering

### Activity Monitoring
- As a developer, I want to see the last commit timestamp and message for each project so I can spot stale apps quickly
- As a developer, I want to see the last deployment status and URL from Vercel so I know what's live

### Project Organization
- As a developer, I want to mark a project as "redundant" so I can visually separate experiments from active work
- As a developer, I want to filter projects by status (active/redundant) and sort by last activity
- As a developer, I want to search projects by name, repo slug, or tech keywords (e.g., "Convex", "Prisma")

---

## Functional Requirements

### 1. Project Discovery (CLI + API)

**CLI Scanner:**
- Scans `/Users/calvinorr/Dev/Projects` recursively for directories containing `package.json`
- For each project, extracts:
  - Name (from `package.json` or directory name)
  - Local absolute path
  - Package manager (npm, yarn, pnpm, bun) from lockfile presence
  - Key dependencies from `package.json`
  - Presence of known config files:
    - `next.config.*` → Next.js project
    - `prisma/schema.prisma` → Prisma
    - `drizzle.config.*` → Drizzle
    - `convex.json` → Convex
    - `pb_data/` folder → PocketBase
- Attempts to detect GitHub repo from `git remote -v` output
- Sends JSON payload to Next.js API route to upsert into Turso

**API Endpoint:**
- `POST /api/ingest/projects` accepts:
  ```json
  {
    "projects": [
      {
        "name": "string",
        "path": "string",
        "packageManager": "npm|yarn|pnpm|bun",
        "dependencies": ["array", "of", "package", "names"],
        "configFiles": ["array", "of", "detected", "configs"],
        "repoSlug": "owner/repo (optional)",
        "vercelProject": "project-name (optional)"
      }
    ]
  }
  ```
- Upserts project records and tech stack snapshots into Turso

### 2. Tech Stack Summarization

**Detection Rules (simple, deterministic):**
- **Framework:**
  - `next` in dependencies → Next.js
  - `react` without `next` → React (plain)
  - `vite` → Vite
- **Database/Backend:**
  - `@prisma/client` + `prisma` → Prisma (likely SQL)
  - `convex` → Convex
  - `@libsql/client` or `@turso/client` → Turso
  - `pocketbase` or presence of `pb_data/` → PocketBase
  - `drizzle-orm` → Drizzle ORM
- **UI Libraries:**
  - `@radix-ui/*` or `shadcn` in any form → shadcn/ui
  - `@mui/*` → Material UI
  - Check for Tailwind in dependencies or config
- **Auth:**
  - `next-auth` → NextAuth
  - `@clerk/*` → Clerk
  - `lucia` → Lucia

**Storage:**
- Store as structured columns: `primaryFramework`, `primaryDB`, `primaryAuth`
- Store additional tech as JSON array: `tags: ["Tailwind", "tRPC", "React Query"]`

### 3. GitHub/Vercel Activity Integration

**Configuration:**
- Store `GITHUB_TOKEN` and `VERCEL_TOKEN` in `.env.local`
- For v1: use personal access tokens (no OAuth)

**Refresh Endpoint:**
- `POST /api/refresh-activity` (manual trigger or scheduled)
- For each project with `repoSlug`:
  - Fetch latest commit on default branch via GitHub API
  - Store: timestamp, commit message, author, SHA, URL
- For each project with `vercelProject`:
  - Fetch latest production deployment via Vercel API
  - Store: timestamp, deployment URL, status (ready/error)
- Insert/update `activity_items` table

**Error Handling:**
- If API calls fail, log error but don't crash
- UI shows last known data with "last refreshed" timestamp

### 4. Project Status and Cleanup

**Status Management:**
- Each project has `status` field: `'active' | 'redundant'` (default: `active`)
- `PATCH /api/projects/[id]/status` endpoint to toggle status
- UI shows status badge and toggle button

**Filtering:**
- Dashboard filters:
  - All projects
  - Active only
  - Redundant only
- Sort options:
  - Last activity (newest first)
  - Name (A-Z)
  - Created date

---

## Non-Functional Requirements

### Performance
- Designed for 10-50 projects (not thousands)
- CLI scanning completes in <30 seconds
- Dashboard loads in <2 seconds with all data

### Reliability
- If GitHub/Vercel APIs are unavailable, UI still works with cached data
- CLI scan failures don't corrupt existing data (use transactions)

### Security/Privacy
- No authentication required (single-user, local deployment)
- API tokens stored in `.env.local` (never committed)
- No logging of sensitive data

### Maintainability
- Use TypeScript throughout
- Clear separation: CLI, API routes, UI components
- Drizzle ORM for type-safe DB access

---

## System Architecture

### Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, shadcn/ui, Tailwind CSS
- **Database:** Turso (cloud SQLite via libSQL)
- **ORM:** Drizzle ORM
- **Deployment:** Vercel (frontend) + Turso cloud
- **CLI:** Node.js script (TypeScript)

### Data Model (Turso/Drizzle Schema)

**projects table:**
```typescript
{
  id: uuid (primary key),
  name: text,
  path: text (unique),
  repoSlug: text (nullable),
  vercelProject: text (nullable),
  status: text ('active' | 'redundant'),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**tech_stack_snapshots table:**
```typescript
{
  id: uuid (primary key),
  projectId: uuid (foreign key → projects),
  primaryFramework: text (nullable),
  primaryDB: text (nullable),
  primaryAuth: text (nullable),
  tags: text (JSON array),
  lastScannedAt: timestamp
}
```

**activity_items table:**
```typescript
{
  id: uuid (primary key),
  projectId: uuid (foreign key → projects),
  type: text ('commit' | 'deployment'),
  timestamp: timestamp,
  title: text,
  url: text (nullable),
  metadata: text (JSON, optional extra data)
}
```

### API Routes

- `POST /api/ingest/projects` – Upsert projects from CLI scan
- `GET /api/projects` – List all projects with filters (status, search)
- `GET /api/projects/[id]` – Get single project detail
- `PATCH /api/projects/[id]/status` – Update project status
- `POST /api/refresh-activity` – Refresh GitHub/Vercel activity for all projects

### CLI Tool

**Location:** `scripts/scan-projects.ts`

**Configuration:** `scan-config.json`
```json
{
  "rootPath": "/Users/calvinorr/Dev/Projects",
  "apiUrl": "http://localhost:3000/api/ingest/projects",
  "apiToken": "optional-secret-if-needed"
}
```

**Workflow:**
1. Read config
2. Scan root path recursively
3. For each directory with `package.json`:
   - Parse package.json
   - Detect configs and technologies
   - Extract git remote
4. Build payload
5. POST to API
6. Log results

---

## User Interface

### Dashboard Page (`/`)

**Layout:**
- Header: "App Catalog" title, refresh button, filter controls
- Filter bar:
  - Status dropdown (All / Active / Redundant)
  - Search input (name, repo, tech keywords)
  - Sort dropdown (Last activity / Name / Created)
- Project grid/table:
  - Each card/row shows:
    - Project name
    - Status badge
    - Primary framework + DB icons/tags
    - Last activity date
    - Quick links (GitHub, Vercel)
    - Redundant toggle button

**Components:**
- shadcn `Card` for project items
- shadcn `Badge` for status and tech tags
- shadcn `Button` for actions
- shadcn `Input` for search

### Project Detail Page (`/projects/[id]`)

**Layout:**
- Header:
  - Project name
  - Status badge + toggle
  - Local path
  - Quick action buttons (Open in Finder, GitHub, Vercel)
- Tabs:
  - **Overview:** Tech stack summary, dependencies, config files detected
  - **Activity:** Timeline of commits and deployments
  - **Metadata:** Created date, last scanned, package manager

**Components:**
- shadcn `Tabs`
- shadcn `Table` for dependencies
- shadcn `Timeline` or custom list for activity

---

## Implementation Phases

### Phase 1: MVP (Week 1)
- [ ] Set up Next.js project with Turso + Drizzle
- [ ] Create DB schema and migrations
- [ ] Build CLI scanner script
- [ ] Implement `POST /api/ingest/projects` endpoint
- [ ] Create basic dashboard UI showing projects list
- [ ] Manual scan and verify data in Turso

### Phase 2: v1 (Week 2)
- [ ] Implement GitHub API integration for last commit
- [ ] Implement Vercel API integration for last deployment
- [ ] Create `POST /api/refresh-activity` endpoint
- [ ] Build project detail page with activity timeline
- [ ] Add status toggle and filters to dashboard
- [ ] Test end-to-end workflow

### Phase 3: Nice-to-Have (Future)
- [ ] Add custom tags and notes per project
- [ ] Staleness indicator (>90 days no activity)
- [ ] GitHub OAuth instead of personal tokens
- [ ] Scheduled auto-refresh (cron or webhook)
- [ ] Export project list as JSON/CSV
- [ ] "Cleanup suggestions" (links to archive/delete on GitHub/Vercel)

---

## Success Metrics

- All projects in `/Users/calvinorr/Dev/Projects` are catalogued
- Tech stack detection accuracy >90%
- Dashboard loads in <2s
- Can identify and mark redundant projects in <1 minute
- No data loss during scans or refreshes

---

## Open Questions

- Should CLI run on a schedule (launchd/cron) or only manual?
- Do you want email/notification when activity refresh fails?
- Should we auto-detect Vercel project from repo name heuristics?

---

## Appendix

### Example Tech Stack Detection

**Project:** `my-saas-app`
- Dependencies: `next`, `@prisma/client`, `next-auth`, `@radix-ui/react-dialog`
- Config files: `next.config.js`, `prisma/schema.prisma`

**Detected Stack:**
- Primary Framework: Next.js
- Primary DB: Prisma
- Primary Auth: NextAuth
- Tags: ["shadcn/ui", "Tailwind", "PostgreSQL"]

### Turso Setup References
- [Next.js + Turso Guide](https://docs.turso.tech/sdk/ts/guides/nextjs)
- [Vercel Turso Starter Template](https://vercel.com/templates/next.js/turso-starter)
- [Drizzle + Turso Tutorial](https://patelvivek.dev/blog/drizzle-turso-nextjs)

---

**End of PRD**
