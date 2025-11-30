/**
 * Mock data for dev mode - matches API response format
 */

export interface MockProject {
  id: string;
  name: string;
  path: string;
  repoSlug: string | null;
  vercelProject: string | null;
  status: 'active' | 'redundant';
  createdAt: Date;
  updatedAt: Date;
  tech: {
    id: string;
    projectId: string;
    primaryFramework: string | null;
    primaryDB: string | null;
    primaryAuth: string | null;
    tags: string;
    lastScannedAt: Date;
  } | null;
}

export interface MockActivity {
  id: string;
  projectId: string;
  projectName: string;
  type: 'commit' | 'deployment';
  timestamp: Date;
  title: string;
  url: string | null;
  metadata: string | null;
}

const now = new Date();

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: '1',
    name: 'nexus-dashboard',
    path: '/Users/calvinorr/Dev/Projects/nexus-dashboard',
    repoSlug: 'calvinorr/nexus-dashboard',
    vercelProject: 'nexus-dash',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    tech: {
      id: 't1',
      projectId: '1',
      primaryFramework: 'React',
      primaryDB: null,
      primaryAuth: null,
      tags: JSON.stringify(['Tailwind', 'Vite']),
      lastScannedAt: now
    }
  },
  {
    id: '2',
    name: 'ecom-api-gateway',
    path: '/Users/calvinorr/Dev/Projects/ecom-api',
    repoSlug: 'calvinorr/ecom-api',
    vercelProject: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    tech: {
      id: 't2',
      projectId: '2',
      primaryFramework: 'Next.js',
      primaryDB: 'Prisma',
      primaryAuth: 'NextAuth',
      tags: JSON.stringify(['TypeScript', 'Apollo']),
      lastScannedAt: now
    }
  },
  {
    id: '3',
    name: 'auth-service-v2',
    path: '/Users/calvinorr/Dev/Projects/auth-v2',
    repoSlug: 'calvinorr/auth-v2',
    vercelProject: null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    tech: {
      id: 't3',
      projectId: '3',
      primaryFramework: 'Next.js',
      primaryDB: 'Drizzle ORM',
      primaryAuth: 'Clerk',
      tags: JSON.stringify(['Turso', 'tRPC']),
      lastScannedAt: now
    }
  },
  {
    id: '4',
    name: 'portfolio-2024',
    path: '/Users/calvinorr/Dev/Projects/portfolio',
    repoSlug: 'calvinorr/portfolio',
    vercelProject: 'portfolio-calvin',
    status: 'redundant',
    createdAt: now,
    updatedAt: now,
    tech: {
      id: 't4',
      projectId: '4',
      primaryFramework: 'Next.js',
      primaryDB: null,
      primaryAuth: null,
      tags: JSON.stringify(['Three.js', 'Framer Motion']),
      lastScannedAt: now
    }
  },
  {
    id: '5',
    name: 'inventory-tracker',
    path: '/Users/calvinorr/Dev/Projects/inv-tracker',
    repoSlug: 'calvinorr/inv-tracker',
    vercelProject: 'inv-internal',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    tech: {
      id: 't5',
      projectId: '5',
      primaryFramework: 'Vite',
      primaryDB: 'Convex',
      primaryAuth: null,
      tags: JSON.stringify(['Vue', 'Tailwind']),
      lastScannedAt: now
    }
  },
  {
    id: '6',
    name: 'cli-deploy-tools',
    path: '/Users/calvinorr/Dev/Projects/deploy-cli',
    repoSlug: 'calvinorr/deploy-cli',
    vercelProject: null,
    status: 'redundant',
    createdAt: now,
    updatedAt: now,
    tech: {
      id: 't6',
      projectId: '6',
      primaryFramework: null,
      primaryDB: null,
      primaryAuth: null,
      tags: JSON.stringify(['Rust', 'CLI']),
      lastScannedAt: now
    }
  }
];

export const MOCK_ACTIVITY: MockActivity[] = [
  {
    id: 'a1',
    projectId: '1',
    projectName: 'nexus-dashboard',
    type: 'commit',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    title: 'feat: added tech stack filters',
    url: 'https://github.com/calvinorr/nexus-dashboard/commit/abc123',
    metadata: JSON.stringify({ sha: 'abc123', author: 'calvinorr' })
  },
  {
    id: 'a2',
    projectId: '1',
    projectName: 'nexus-dashboard',
    type: 'deployment',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    title: 'Deployment READY',
    url: 'https://nexus-dash.vercel.app',
    metadata: JSON.stringify({ state: 'READY' })
  },
  {
    id: 'a3',
    projectId: '2',
    projectName: 'ecom-api-gateway',
    type: 'commit',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    title: 'fix: cache invalidation strategy',
    url: 'https://github.com/calvinorr/ecom-api/commit/def456',
    metadata: JSON.stringify({ sha: 'def456', author: 'calvinorr' })
  },
  {
    id: 'a4',
    projectId: '3',
    projectName: 'auth-service-v2',
    type: 'deployment',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    title: 'Deployment ERROR',
    url: null,
    metadata: JSON.stringify({ state: 'ERROR' })
  },
  {
    id: 'a5',
    projectId: '4',
    projectName: 'portfolio-2024',
    type: 'commit',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    title: 'content: updated blog posts',
    url: 'https://github.com/calvinorr/portfolio/commit/ghi789',
    metadata: JSON.stringify({ sha: 'ghi789', author: 'calvinorr' })
  }
];
