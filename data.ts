
import { ProjectData, ProjectCategory, ActivityPoint } from './types';

const generateDeployments = (count: number, baseStatus: 'success' | 'failed' = 'success'): any[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `dep-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date(Date.now() - i * 86400000 * (Math.random() * 5)).toISOString(),
    commitMessage: i === 0 ? 'feat: updated dashboard layout' : `fix: minor bugs in ${Math.random() > 0.5 ? 'api' : 'ui'}`,
    status: i === 0 && Math.random() > 0.8 ? 'building' : (Math.random() > 0.9 ? 'failed' : baseStatus),
    branch: 'main',
    author: 'calvinorr',
    duration: `${Math.floor(Math.random() * 120) + 45}s`
  }));
};

// Helper to generate heatmap data
const generateActivity = (days: number, type: 'commits' | 'deployments', failureRate = 0.1): ActivityPoint[] => {
  const points: ActivityPoint[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random activity density
    const hasActivity = Math.random() > 0.4;
    const count = hasActivity ? Math.floor(Math.random() * 8) + 1 : 0;
    
    // Determine level (0-4)
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) level = 1;
    if (count > 2) level = 2;
    if (count > 5) level = 3;
    if (count > 10) level = 4;

    // Status logic for deployments
    let status: 'success' | 'failed' | 'neutral' = 'neutral';
    if (type === 'deployments' && count > 0) {
      status = Math.random() < failureRate ? 'failed' : 'success';
    }

    points.push({
      date: date.toISOString().split('T')[0],
      count,
      level,
      status
    });
  }
  return points;
};

export const MOCK_PROJECTS: ProjectData[] = [
  {
    id: '1',
    name: 'nexus-dashboard',
    description: 'Main developer dashboard for personal infrastructure management.',
    category: ProjectCategory.Frontend,
    status: 'active',
    repoUrl: 'github.com/calvinorr/nexus-dashboard',
    vercelUrl: 'nexus-dash.vercel.app',
    techStack: ['React', 'Tailwind', 'Vite'],
    framework: 'React',
    lastDeployment: {
      id: 'dep-1',
      date: new Date().toISOString(),
      commitMessage: 'feat: added tech stack filters',
      status: 'building',
      branch: 'main',
      author: 'calvinorr',
      duration: '45s'
    },
    recentDeployments: generateDeployments(5),
    actions: [
      { name: 'Build & Test', status: 'running', lastRun: 'Now' },
      { name: 'Lint', status: 'passing', lastRun: '2m ago' }
    ],
    commitActivity: generateActivity(90, 'commits'),
    deploymentActivity: generateActivity(90, 'deployments', 0.05)
  },
  {
    id: '2',
    name: 'ecom-api-gateway',
    description: 'GraphQL federation gateway for the e-commerce platform microservices.',
    category: ProjectCategory.Backend,
    status: 'active',
    repoUrl: 'github.com/calvinorr/ecom-api',
    techStack: ['Node.js', 'Apollo', 'TypeScript'],
    framework: 'Node.js',
    backend: 'Redis',
    lastDeployment: {
      id: 'dep-2',
      date: new Date(Date.now() - 3600000).toISOString(),
      commitMessage: 'fix: cache invalidation strategy',
      status: 'success',
      branch: 'prod',
      author: 'calvinorr',
      duration: '120s'
    },
    recentDeployments: generateDeployments(8),
    actions: [
      { name: 'Integration Tests', status: 'passing', lastRun: '1h ago' },
      { name: 'Docker Build', status: 'passing', lastRun: '1h ago' }
    ],
    commitActivity: generateActivity(90, 'commits'),
    deploymentActivity: generateActivity(90, 'deployments', 0.02)
  },
  {
    id: '3',
    name: 'auth-service-v2',
    description: 'Centralized authentication service using OAuth2 and JWT rotation.',
    category: ProjectCategory.Backend,
    status: 'active',
    repoUrl: 'github.com/calvinorr/auth-v2',
    techStack: ['Go', 'Gin', 'gRPC'],
    framework: 'Go',
    database: 'PostgreSQL',
    lastDeployment: {
      id: 'dep-3',
      date: new Date(Date.now() - 86400000).toISOString(),
      commitMessage: 'chore: rotate secrets',
      status: 'failed',
      branch: 'main',
      author: 'calvinorr',
      duration: '15s'
    },
    recentDeployments: generateDeployments(3, 'failed'),
    actions: [
      { name: 'Security Scan', status: 'failing', lastRun: '1d ago' },
      { name: 'Unit Tests', status: 'passing', lastRun: '1d ago' }
    ],
    commitActivity: generateActivity(90, 'commits'),
    deploymentActivity: generateActivity(90, 'deployments', 0.4) // Unstable
  },
  {
    id: '4',
    name: 'portfolio-2024',
    description: 'Personal portfolio site with 3D canvas elements.',
    category: ProjectCategory.Frontend,
    status: 'redundant',
    repoUrl: 'github.com/calvinorr/portfolio',
    vercelUrl: 'calvin.dev',
    techStack: ['Next.js', 'Three.js', 'Framer Motion'],
    framework: 'Next.js',
    lastDeployment: {
      id: 'dep-4',
      date: new Date(Date.now() - 172800000).toISOString(),
      commitMessage: 'content: updated blog posts',
      status: 'success',
      branch: 'main',
      author: 'calvinorr',
      duration: '90s'
    },
    recentDeployments: generateDeployments(4),
    actions: [
      { name: 'Lighthouse CI', status: 'passing', lastRun: '2d ago' }
    ],
    commitActivity: generateActivity(90, 'commits'),
    deploymentActivity: generateActivity(90, 'deployments', 0.1)
  },
  {
    id: '5',
    name: 'inventory-tracker',
    description: 'Internal tool for tracking hardware assets across the office.',
    category: ProjectCategory.Fullstack,
    status: 'active',
    repoUrl: 'github.com/calvinorr/inv-tracker',
    vercelUrl: 'inv-internal.vercel.app',
    techStack: ['Vue', 'Nuxt', 'Tailwind'],
    framework: 'Nuxt',
    database: 'Supabase',
    lastDeployment: {
      id: 'dep-5',
      date: new Date(Date.now() - 432000000).toISOString(),
      commitMessage: 'feat: qr code generation',
      status: 'success',
      branch: 'feature/qr',
      author: 'calvinorr',
      duration: '210s'
    },
    recentDeployments: generateDeployments(6),
    actions: [
      { name: 'E2E Cypress', status: 'passing', lastRun: '5d ago' }
    ],
    commitActivity: generateActivity(90, 'commits'),
    deploymentActivity: generateActivity(90, 'deployments', 0.0)
  },
  {
    id: '6',
    name: 'cli-deploy-tools',
    description: 'Rust-based CLI for automating deployment scripts.',
    category: ProjectCategory.Tooling,
    status: 'redundant',
    repoUrl: 'github.com/calvinorr/deploy-cli',
    techStack: ['Rust', 'Clap'],
    framework: 'Rust',
    lastDeployment: {
      id: 'dep-6',
      date: new Date(Date.now() - 604800000).toISOString(),
      commitMessage: 'release: v1.2.0',
      status: 'success',
      branch: 'main',
      author: 'calvinorr',
      duration: '300s'
    },
    recentDeployments: generateDeployments(2),
    actions: [
      { name: 'Cargo Test', status: 'passing', lastRun: '1w ago' },
      { name: 'Release Build', status: 'passing', lastRun: '1w ago' }
    ],
    commitActivity: generateActivity(90, 'commits'),
    deploymentActivity: generateActivity(90, 'deployments', 0.0)
  }
];
