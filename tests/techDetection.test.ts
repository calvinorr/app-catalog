import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectProject, extractRepoSlug, findProjects, summarizeTech } from '../scanner/detect';

const tmpDirs: string[] = [];

function createTempProject(structure: Record<string, string>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-catalog-'));
  tmpDirs.push(dir);
  for (const [relative, content] of Object.entries(structure)) {
    const fullPath = path.join(dir, relative);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }
  return dir;
}

afterEach(() => {
  while (tmpDirs.length) {
    const dir = tmpDirs.pop();
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('extractRepoSlug', () => {
  it('parses SSH URLs', () => {
    expect(extractRepoSlug('git@github.com:calvinorr/app-catalog.git')).toBe('calvinorr/app-catalog');
  });

  it('parses HTTPS URLs', () => {
    expect(extractRepoSlug('https://github.com/calvinorr/app-catalog.git')).toBe('calvinorr/app-catalog');
  });

  it('returns null on unknown format', () => {
    expect(extractRepoSlug('file:///tmp/repo')).toBeNull();
  });
});

describe('summarizeTech', () => {
  it('detects frameworks, db, auth, and tags', () => {
    const deps = new Set(['next', '@prisma/client', 'next-auth', 'tailwindcss', '@radix-ui/react-dialog']);
    const summary = summarizeTech(deps, ['prisma/schema.prisma', 'tailwind.config.js'], '/tmp');
    expect(summary.primaryFramework).toBe('Next.js');
    expect(summary.primaryDB).toBe('Prisma');
    expect(summary.primaryAuth).toBe('NextAuth');
    expect(summary.tags).toEqual(expect.arrayContaining(['Tailwind', 'shadcn/ui']));
  });
});

describe('detectProject + findProjects', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = createTempProject({
      'package.json': JSON.stringify({
        name: 'temp-app',
        dependencies: {
          next: '14.0.0',
          '@prisma/client': '5.0.0'
        },
        devDependencies: {
          tailwindcss: '3.4.0'
        }
      }),
      'prisma/schema.prisma': '',
      'tailwind.config.js': ''
    });
  });

  it('detects a project with package.json', () => {
    const detected = detectProject(projectDir);
    expect(detected?.name).toBe('temp-app');
    expect(detected?.packageManager).toBeNull();
    expect(detected?.tech.primaryFramework).toBe('Next.js');
    expect(detected?.tech.primaryDB).toBe('Prisma');
    expect(detected?.configFiles).toContain('prisma/schema.prisma');
  });

  it('finds nested projects recursively', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'root-'));
    tmpDirs.push(root);
    const nested = path.join(root, 'apps', 'demo');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, 'package.json'), '{"name": "demo"}');

    const found = findProjects(root);
    expect(found).toContain(nested);
  });
});
