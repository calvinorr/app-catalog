import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, techStackSnapshots } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Tech detection from package.json dependencies
interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function detectFramework(deps: Record<string, string>): string | null {
  if (deps['next']) return 'Next.js';
  if (deps['vite'] || deps['@vitejs/plugin-react']) return 'Vite';
  if (deps['react']) return 'React';
  if (deps['vue']) return 'Vue';
  if (deps['svelte'] || deps['@sveltejs/kit']) return 'Svelte';
  if (deps['express']) return 'Express';
  if (deps['fastify']) return 'Fastify';
  return null;
}

function detectDatabase(deps: Record<string, string>): string | null {
  if (deps['@prisma/client'] || deps['prisma']) return 'Prisma';
  if (deps['drizzle-orm']) return 'Drizzle ORM';
  if (deps['@libsql/client'] || deps['@turso/client']) return 'Turso';
  if (deps['@supabase/supabase-js']) return 'Supabase';
  if (deps['convex']) return 'Convex';
  if (deps['pocketbase']) return 'PocketBase';
  if (deps['mongoose']) return 'MongoDB';
  if (deps['pg'] || deps['postgres']) return 'PostgreSQL';
  if (deps['mysql2']) return 'MySQL';
  return null;
}

function detectAuth(deps: Record<string, string>): string | null {
  if (deps['next-auth'] || deps['@auth/core']) return 'NextAuth';
  if (deps['@clerk/nextjs'] || deps['@clerk/clerk-react']) return 'Clerk';
  if (deps['lucia'] || deps['lucia-auth']) return 'Lucia';
  if (deps['@supabase/auth-helpers-nextjs']) return 'Supabase Auth';
  return null;
}

function detectTags(deps: Record<string, string>): string[] {
  const tags: string[] = [];

  // TypeScript
  if (deps['typescript']) tags.push('TypeScript');

  // UI Libraries
  if (deps['@shadcn/ui'] || deps['class-variance-authority']) tags.push('shadcn/ui');
  if (deps['@radix-ui/react-dialog']) tags.push('Radix UI');
  if (deps['@mui/material']) tags.push('Material UI');
  if (deps['@chakra-ui/react']) tags.push('Chakra UI');

  // Styling
  if (deps['tailwindcss']) tags.push('Tailwind CSS');
  if (deps['styled-components']) tags.push('Styled Components');

  // Data Fetching
  if (deps['@tanstack/react-query']) tags.push('React Query');
  if (deps['@trpc/client'] || deps['@trpc/server']) tags.push('tRPC');
  if (deps['swr']) tags.push('SWR');
  if (deps['axios']) tags.push('Axios');

  // State Management
  if (deps['zustand']) tags.push('Zustand');
  if (deps['@reduxjs/toolkit'] || deps['redux']) tags.push('Redux');
  if (deps['jotai']) tags.push('Jotai');
  if (deps['recoil']) tags.push('Recoil');

  // Testing
  if (deps['vitest']) tags.push('Vitest');
  if (deps['jest']) tags.push('Jest');
  if (deps['@playwright/test']) tags.push('Playwright');

  return tags;
}

// DevDash manifest file structure
interface DevDashManifest {
  name?: string;
  description?: string;
  category?: string;
  database?: string;
  framework?: string;
  tags?: string[];
}

async function fetchFileFromGitHub(repoSlug: string, path: string, token: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoSlug}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.content) return null;

    // Decode base64 content
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

async function fetchDevDashManifest(repoSlug: string, token: string): Promise<DevDashManifest | null> {
  const content = await fetchFileFromGitHub(repoSlug, '.devdash.json', token);
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Paths to check for package.json in monorepos
const PACKAGE_JSON_PATHS = [
  'package.json',
  'frontend/package.json',
  'app/package.json',
  'web/package.json',
  'client/package.json',
  'src/package.json'
];

async function fetchPackageJson(repoSlug: string, token: string): Promise<PackageJson | null> {
  // Try each path in order until we find a package.json
  for (const path of PACKAGE_JSON_PATHS) {
    const content = await fetchFileFromGitHub(repoSlug, path, token);
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        continue;
      }
    }
  }
  return null;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
}

// Generic repo names that should use full_name for display
const GENERIC_REPO_NAMES = ['frontend', 'backend', 'app', 'web', 'client', 'server', 'api', 'ui', 'site', 'website', 'project', 'demo', 'test', 'src'];

function humanizeRepoName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function generateDisplayName(repo: GitHubRepo): string | null {
  const lowerName = repo.name.toLowerCase();

  // If repo name is generic, use full_name to generate a better display name
  if (GENERIC_REPO_NAMES.includes(lowerName)) {
    // full_name is "owner/repo-name", extract repo-name and humanize it
    const repoNameFromSlug = repo.full_name.split('/')[1];
    if (repoNameFromSlug && repoNameFromSlug.toLowerCase() !== lowerName) {
      return humanizeRepoName(repoNameFromSlug);
    }
    // If still generic, include owner context
    return humanizeRepoName(repo.full_name.replace('/', ' - '));
  }

  return null; // Use default name
}

async function fetchAllRepos(token: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos: GitHubRepo[] = await response.json();

    if (repos.length === 0) {
      break;
    }

    allRepos.push(...repos);

    if (repos.length < perPage) {
      break;
    }

    page++;
  }

  return allRepos;
}

export async function POST() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    const repos = await fetchAllRepos(token);
    const now = new Date();
    let insertedCount = 0;
    let updatedCount = 0;

    for (const repo of repos) {
      // Use full_name as path for GitHub repos (e.g., "username/repo-name")
      const path = `github:${repo.full_name}`;
      const id = crypto.randomUUID();

      // Check if project already exists
      const existing = await db
        .select()
        .from(projects)
        .where(eq(projects.path, path))
        .limit(1);

      const isUpdate = existing.length > 0;

      // Parse pushed_at as lastCommitAt timestamp
      const lastCommitAt = repo.pushed_at ? new Date(repo.pushed_at) : null;

      // Generate a user-friendly display name for generic repo names
      const displayName = generateDisplayName(repo);

      await db
        .insert(projects)
        .values({
          id,
          name: repo.name,
          displayName,
          path,
          repoSlug: repo.full_name,
          vercelProject: null,
          status: repo.archived ? 'redundant' : 'active',
          source: 'github',
          description: repo.description,
          language: repo.language,
          htmlUrl: repo.html_url,
          lastCommitAt,
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: projects.path,
          set: {
            name: repo.name,
            displayName,
            repoSlug: repo.full_name,
            status: repo.archived ? 'redundant' : 'active',
            description: repo.description,
            language: repo.language,
            htmlUrl: repo.html_url,
            lastCommitAt,
            updatedAt: now
          }
        });

      if (isUpdate) {
        updatedCount++;
      } else {
        insertedCount++;
      }

      // Check for .devdash.json manifest (overrides auto-detection)
      const projectId = isUpdate ? existing[0].id : id;
      const manifest = await fetchDevDashManifest(repo.full_name, token);

      // Auto-detect tech stack from package.json
      const packageJson = await fetchPackageJson(repo.full_name, token);

      let framework: string | null = null;
      let database: string | null = null;
      let auth: string | null = null;
      let tags: string[] = [];

      if (packageJson) {
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        framework = detectFramework(allDeps);
        database = detectDatabase(allDeps);
        auth = detectAuth(allDeps);
        tags = detectTags(allDeps);
      }

      // Override with manifest values if present
      if (manifest) {
        if (manifest.framework) framework = manifest.framework;
        if (manifest.database) database = manifest.database;
        if (manifest.tags) tags = [...tags, ...manifest.tags.filter(t => !tags.includes(t))];

        // Also update project description from manifest if provided
        if (manifest.description) {
          await db
            .update(projects)
            .set({ description: manifest.description, updatedAt: now })
            .where(eq(projects.id, projectId));
        }
      }

      // Create tech snapshot if we detected anything
      if (framework || database || auth || tags.length > 0) {
        await db
          .insert(techStackSnapshots)
          .values({
            id: `tech-${projectId}`,
            projectId,
            primaryFramework: framework,
            primaryDB: database,
            primaryAuth: auth,
            tags: JSON.stringify(tags),
            lastScannedAt: now
          })
          .onConflictDoUpdate({
            target: techStackSnapshots.projectId,
            set: {
              primaryFramework: framework,
              primaryDB: database,
              primaryAuth: auth,
              tags: JSON.stringify(tags),
              lastScannedAt: now
            }
          });
      }
    }

    return NextResponse.json({
      ok: true,
      total: repos.length,
      inserted: insertedCount,
      updated: updatedCount
    });
  } catch (error) {
    console.error('Error syncing GitHub repos:', error);
    return NextResponse.json(
      { error: 'Failed to sync GitHub repositories' },
      { status: 500 }
    );
  }
}
