import { ProjectData, ProjectStatus, ActivityItem, ProjectCategory, ActivityPoint, Deployment } from '@/types';
import { MOCK_PROJECTS } from '@/data';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const res = await fetch(input, init);
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    return res;
  } catch (err) {
    console.warn('API unavailable, falling back to mock data.', err);
    return null;
  }
}

// Generate placeholder activity data
function generateActivity(days: number): ActivityPoint[] {
  const points: ActivityPoint[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const count = Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) level = 1;
    if (count > 2) level = 2;
    if (count > 4) level = 3;
    points.push({ date: date.toISOString().split('T')[0], count, level });
  }
  return points;
}

// Generate placeholder deployment
function generateDeployment(): Deployment {
  return {
    id: `dep-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    commitMessage: 'Recent deployment',
    status: 'success',
    branch: 'main',
    author: 'calvinorr',
    duration: '45s'
  };
}

// Infer category from tech stack
function inferCategory(framework: string | null, db: string | null): ProjectCategory {
  if (db && framework) return ProjectCategory.Fullstack;
  if (db) return ProjectCategory.Backend;
  if (framework) return ProjectCategory.Frontend;
  return ProjectCategory.Tooling;
}

// Transform API response to ProjectData format
interface APIProject {
  id: string;
  name: string;
  path: string;
  repoSlug: string | null;
  vercelProject: string | null;
  status: 'active' | 'redundant';
  tech?: {
    primaryFramework: string | null;
    primaryDB: string | null;
    primaryAuth: string | null;
    tags: string;
  } | null;
}

function transformProject(p: APIProject): ProjectData {
  const tags = p.tech?.tags ? JSON.parse(p.tech.tags) : [];
  const framework = p.tech?.primaryFramework || 'Unknown';
  const techStack = [framework, p.tech?.primaryDB, p.tech?.primaryAuth, ...tags].filter(Boolean) as string[];

  return {
    id: p.id,
    name: p.name,
    description: `Project at ${p.path}`,
    category: inferCategory(p.tech?.primaryFramework || null, p.tech?.primaryDB || null),
    status: p.status,
    repoUrl: p.repoSlug ? `github.com/${p.repoSlug}` : '',
    repoSlug: p.repoSlug,
    vercelUrl: p.vercelProject ? `${p.vercelProject}.vercel.app` : undefined,
    vercelProject: p.vercelProject,
    techStack,
    framework,
    database: p.tech?.primaryDB || undefined,
    backend: p.tech?.primaryAuth || undefined,
    lastDeployment: generateDeployment(),
    recentDeployments: [generateDeployment()],
    actions: [],
    commitActivity: generateActivity(90),
    deploymentActivity: generateActivity(90)
  };
}

export async function fetchProjects(): Promise<ProjectData[]> {
  const res = await safeFetch(`${API_BASE}/projects`);
  if (!res) return MOCK_PROJECTS;
  try {
    const data = await res.json();
    // If devMode flag is set, the API already returns mock data that may need transformation
    if (data.devMode) {
      return data.projects.map(transformProject);
    }
    return data.projects.map(transformProject);
  } catch (err) {
    console.warn('Failed to parse projects response, using mock.', err);
    return MOCK_PROJECTS;
  }
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  await safeFetch(`${API_BASE}/projects/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

export async function fetchActivity(): Promise<ActivityItem[]> {
  const res = await safeFetch(`${API_BASE}/activity`);
  if (!res) return [];
  try {
    const data = await res.json();
    // Transform timestamp to string if needed
    return data.activity.map((a: any) => ({
      ...a,
      timestamp: typeof a.timestamp === 'object' ? new Date(a.timestamp).toISOString() : a.timestamp
    }));
  } catch (err) {
    console.warn('Failed to parse activity response, using fallback.', err);
    return [];
  }
}
