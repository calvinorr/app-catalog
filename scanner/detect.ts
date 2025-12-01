import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { DetectedProject, TechSnapshot } from './types';

const CONFIG_PATTERNS = [
  'next.config.js',
  'next.config.ts',
  'next.config.mjs',
  'prisma/schema.prisma',
  'drizzle.config.ts',
  'drizzle.config.mjs',
  'convex.json',
  'pb_data',
  'tailwind.config.js',
  'tailwind.config.cjs',
  'tailwind.config.ts'
];

const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', '.next', '.turbo', '.vercel', '.pnpm-store']);

export function detectPackageManager(projectPath: string): DetectedProject['packageManager'] {
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(projectPath, 'bun.lockb'))) return 'bun';
  if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) return 'npm';
  return null;
}

export function detectConfigFiles(projectPath: string): string[] {
  return CONFIG_PATTERNS.filter((config) => fs.existsSync(path.join(projectPath, config)));
}

function parseDependencies(pkg: any): string[] {
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };
  return Object.keys(deps);
}

function detectFramework(deps: Set<string>): string | null {
  // Meta-frameworks (highest priority - they include base frameworks)
  if (deps.has('next')) return 'Next.js';
  if (deps.has('nuxt')) return 'Nuxt';
  if (deps.has('@remix-run/react') || deps.has('@remix-run/node')) return 'Remix';
  if (deps.has('@sveltejs/kit')) return 'SvelteKit';
  if (deps.has('astro')) return 'Astro';

  // Build tools / bundlers (check before base frameworks)
  if (deps.has('vite')) return 'Vite';

  // Base frontend frameworks
  if (deps.has('vue')) return 'Vue';
  if (deps.has('svelte')) return 'Svelte';
  if (deps.has('@angular/core')) return 'Angular';
  if (deps.has('react')) return 'React';

  return null;
}

function detectBackendFramework(deps: Set<string>): string | null {
  if (deps.has('express')) return 'Express';
  if (deps.has('fastify')) return 'Fastify';
  if (deps.has('hono')) return 'Hono';
  if (deps.has('@nestjs/core')) return 'NestJS';
  if (deps.has('koa')) return 'Koa';
  if (deps.has('elysia')) return 'Elysia';
  return null;
}

function detectDatabase(deps: Set<string>, configFiles: string[], projectPath: string): string | null {
  // Check Prisma
  if (deps.has('@prisma/client') || deps.has('prisma')) return 'Prisma';
  // Check Drizzle ORM (can be used with various databases)
  if (deps.has('drizzle-orm')) {
    // If both Drizzle and Turso, prefer "Drizzle + Turso"
    if (deps.has('@libsql/client') || deps.has('@turso/client')) return 'Drizzle + Turso';
    return 'Drizzle ORM';
  }
  // Check Turso standalone
  if (deps.has('@libsql/client') || deps.has('@turso/client')) return 'Turso';
  // Check Supabase
  if (deps.has('@supabase/supabase-js') || deps.has('@supabase/auth-helpers-nextjs')) return 'Supabase';
  // Check Convex
  if (deps.has('convex')) return 'Convex';
  // Check PocketBase
  if (deps.has('pocketbase') || configFiles.includes('pb_data') || fs.existsSync(path.join(projectPath, 'pb_data'))) return 'PocketBase';
  return null;
}

function detectAuth(deps: Set<string>): string | null {
  // Check NextAuth (also covers next-auth v5 / Auth.js)
  if (deps.has('next-auth') || deps.has('auth')) return 'NextAuth';
  // Check Clerk
  if ([...deps].some((d) => d.startsWith('@clerk/'))) return 'Clerk';
  // Check Lucia
  if (deps.has('lucia') || deps.has('lucia-auth')) return 'Lucia';
  // Check Supabase Auth
  if (deps.has('@supabase/supabase-js') || deps.has('@supabase/auth-helpers-nextjs')) return 'Supabase Auth';
  return null;
}

function detectTags(deps: Set<string>, configFiles: string[]): string[] {
  const tags = new Set<string>();

  // UI Libraries
  if ([...deps].some((d) => d.startsWith('@radix-ui/')) || [...deps].some((d) => d.includes('shadcn'))) {
    tags.add('shadcn/ui');
  }
  if ([...deps].some((d) => d.startsWith('@mui/'))) tags.add('Material UI');

  // CSS/Styling
  if (deps.has('tailwindcss') || configFiles.some((c) => c.startsWith('tailwind.config'))) {
    tags.add('Tailwind');
  }

  // API/Data fetching
  if (deps.has('trpc') || deps.has('@trpc/server') || deps.has('@trpc/client')) tags.add('tRPC');
  if (deps.has('@tanstack/react-query') || deps.has('react-query')) tags.add('React Query');

  // State Management
  if (deps.has('zustand')) tags.add('Zustand');
  if (deps.has('redux') || deps.has('@reduxjs/toolkit')) tags.add('Redux');
  if (deps.has('jotai')) tags.add('Jotai');
  if (deps.has('recoil')) tags.add('Recoil');

  // Testing
  if (deps.has('vitest')) tags.add('Vitest');
  if (deps.has('jest')) tags.add('Jest');
  if (deps.has('@playwright/test')) tags.add('Playwright');

  // TypeScript
  if (deps.has('typescript')) tags.add('TypeScript');

  return Array.from(tags);
}

function detectVercelProject(projectPath: string): { projectId: string | null; orgId: string | null } {
  const vercelProjectPath = path.join(projectPath, '.vercel', 'project.json');
  if (!fs.existsSync(vercelProjectPath)) {
    return { projectId: null, orgId: null };
  }

  try {
    const vercelProjectRaw = fs.readFileSync(vercelProjectPath, 'utf-8');
    const vercelProject = JSON.parse(vercelProjectRaw);
    return {
      projectId: vercelProject.projectId || null,
      orgId: vercelProject.orgId || null
    };
  } catch {
    return { projectId: null, orgId: null };
  }
}

export function summarizeTech(deps: Set<string>, configFiles: string[], projectPath: string): TechSnapshot {
  const vercelInfo = detectVercelProject(projectPath);
  return {
    primaryFramework: detectFramework(deps),
    backendFramework: detectBackendFramework(deps),
    primaryDB: detectDatabase(deps, configFiles, projectPath),
    primaryAuth: detectAuth(deps),
    tags: detectTags(deps, configFiles),
    vercelProjectId: vercelInfo.projectId,
    vercelOrgId: vercelInfo.orgId
  };
}

export function extractRepoSlug(remoteUrl: string): string | null {
  // Handles git@github.com:owner/repo.git and https://github.com/owner/repo.git
  const sshMatch = remoteUrl.match(/git@[^:]+:([^/]+)\/(.+?)(\.git)?$/);
  if (sshMatch) return `${sshMatch[1]}/${sshMatch[2]}`;
  const httpsMatch = remoteUrl.match(/https?:\/\/[^/]+\/([^/]+)\/(.+?)(\.git)?$/);
  if (httpsMatch) return `${httpsMatch[1]}/${httpsMatch[2]}`;
  return null;
}

export function detectGitRemote(projectPath: string): string | null {
  const result = spawnSync('git', ['config', '--get', 'remote.origin.url'], {
    cwd: projectPath,
    encoding: 'utf-8'
  });
  if (result.status !== 0 || !result.stdout.trim()) return null;
  return extractRepoSlug(result.stdout.trim());
}

export function detectProject(projectPath: string): DetectedProject | null {
  const pkgPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;

  const pkgRaw = fs.readFileSync(pkgPath, 'utf-8');
  let pkg: any;
  try {
    pkg = JSON.parse(pkgRaw);
  } catch {
    return null;
  }

  const dependencies = parseDependencies(pkg);
  const depsSet = new Set(dependencies);
  const configFiles = detectConfigFiles(projectPath);
  const tech = summarizeTech(depsSet, configFiles, projectPath);

  return {
    name: pkg.name || path.basename(projectPath),
    path: projectPath,
    packageManager: detectPackageManager(projectPath),
    dependencies,
    configFiles,
    repoSlug: detectGitRemote(projectPath),
    vercelProject: null,
    status: 'active',
    tech
  };
}

export function findProjects(rootPath: string): string[] {
  const projects: string[] = [];
  const queue: string[] = [rootPath];

  while (queue.length > 0) {
    const current = queue.pop() as string;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    const hasPackageJson = entries.some((e) => e.isFile() && e.name === 'package.json');
    if (hasPackageJson) {
      projects.push(current);
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      queue.push(path.join(current, entry.name));
    }
  }

  return projects;
}

export function scanProjects(rootPath: string): DetectedProject[] {
  const projectDirs = findProjects(rootPath);
  return projectDirs
    .map((dir) => detectProject(dir))
    .filter((p): p is DetectedProject => Boolean(p));
}
