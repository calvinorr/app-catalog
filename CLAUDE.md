# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

App Catalogue (DevDash) is a dashboard for browsing and managing a catalog of personal development projects. It consists of two parts:
- **Frontend**: Vite + React 19 static UI (port 3000)
- **Backend**: Next.js 14 App Router with Drizzle ORM + Turso (port 3001)

The frontend currently uses mock data in `data.ts`. The goal is to wire it to the backend API for live data from scanned projects.

## Commands

### Frontend (root)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Production build
npm test             # Run vitest tests
npm run scan         # Run project scanner CLI (requires scan-config.json)
```

### Backend (backend/)
```bash
npm install --prefix backend      # Install backend dependencies
npm run dev --prefix backend      # Start Next.js (port 3001)
npm run build --prefix backend    # Build backend
npm run lint --prefix backend     # ESLint
npm run db:generate --prefix backend  # Generate Drizzle migrations
npm run db:migrate --prefix backend   # Apply migrations to Turso
```

### Running a single test
```bash
npx vitest run tests/techDetection.test.ts
npx vitest run tests/statusFilter.test.ts
```

## Architecture

### Dual-App Structure
- Vite frontend runs on `:3000` and proxies `/api/*` to `:3001` (see `vite.config.ts`)
- Backend is Next.js App Router in `backend/app/api/`

### Key Directories
- `components/` - React UI components (AppCard, AppDetails, ActivityHeatmap, etc.)
- `scanner/` - Tech stack detection logic (`detect.ts` detects frameworks, DBs, auth from package.json)
- `scripts/` - CLI tools (`scan-projects.ts` scans local projects and POSTs to ingest API)
- `backend/lib/` - Drizzle schema and DB connection
- `backend/app/api/` - Next.js API routes

### Database Schema (Turso/SQLite via Drizzle)
Three tables in `backend/lib/schema.ts`:
- `projects` - Core project records (name, path, repo_slug, status active/redundant)
- `tech_stack_snapshots` - Framework/DB/auth detection results per project
- `activity_items` - GitHub commits and Vercel deployments

### API Routes
- `POST /api/ingest/projects` - Upsert scanned projects
- `GET /api/projects` - List all projects with tech snapshots
- `PATCH /api/projects/[id]/status` - Toggle active/redundant status
- `GET /api/activity` - Get recent activity items
- `POST /api/refresh-activity` - Pull latest from GitHub/Vercel APIs

### Scanner Flow
1. `scripts/scan-projects.ts` reads `scan-config.json` for root path
2. Calls `scanner/detect.ts` to find all `package.json` projects
3. Detects framework (Next.js/Vite/React), DB (Prisma/Drizzle/Turso/Convex/PocketBase), auth (NextAuth/Clerk/Lucia)
4. Posts results to `/api/ingest/projects`

### Type Definitions
- `types.ts` (root) - Frontend types (ProjectData, Deployment, ActivityItem)
- `scanner/types.ts` - Scanner types (DetectedProject, TechSnapshot)

## Environment Variables

Backend requires (see `backend/.env.example`):
- `TURSO_URL` - Turso database URL
- `TURSO_TOKEN` - Turso auth token
- `GITHUB_TOKEN` - GitHub PAT for commit activity
- `VERCEL_TOKEN` - Vercel API token for deployments
- `VERCEL_TEAM` - (optional) Vercel team slug

Frontend (optional):
- `VITE_API_BASE` - Override API base URL (defaults to `/api`)

## Path Alias

Both apps use `@/` path alias:
- Root tsconfig maps `@/*` to `./*`
- Vite config sets up the alias for bundling

## Deployment (Vercel)

**IMPORTANT**: The Next.js app lives in `backend/`, NOT the root directory.

### Production URL
- https://backend-calvin-orrs-projects.vercel.app

### Deploying Changes

**DO NOT USE `vercel --prod` CLI** - The Vercel CLI does not work correctly with this project due to rootDirectory configuration conflicts. This has been attempted multiple times and always fails.

**ALWAYS deploy via Git push:**
```bash
git add -A && git commit -m "your message" && git push
```

Pushing to `main` branch triggers automatic Vercel deployment via GitHub integration.

### Vercel Project Configuration
The Vercel project "backend" is configured with:
- **Root Directory**: `backend` (set in Vercel Dashboard, NOT in local config)
- **Framework**: Next.js
- **Node Version**: 22.x (per package.json engines)

This configuration means:
- GitHub pushes work correctly (Vercel looks in `/backend/` from repo root)
- CLI deploys DO NOT work (CLI applies rootDirectory on top of current directory, causing "backend/backend" path error)

### Environment Variables (Vercel)
Ensure these are set in Vercel project settings:
- `TURSO_URL`
- `TURSO_TOKEN`
- `GITHUB_TOKEN`
- `VERCEL_TOKEN`

## Local Development Notes

The Vite frontend (root) and Next.js backend (backend/) are separate apps:
- **For testing UI**: Use Vercel deployment (local Vite has compatibility issues)
- **For API development**: Run `npm run dev` from `backend/` directory
