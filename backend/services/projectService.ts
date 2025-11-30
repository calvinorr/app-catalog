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

// Generate empty activity data (no fake data)
function generateEmptyActivity(days: number): ActivityPoint[] {
  const points: ActivityPoint[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    points.push({ date: date.toISOString().split('T')[0], count: 0, level: 0 });
  }
  return points;
}

// Create deployment from real timestamp
function createDeploymentFromTimestamp(timestamp: Date | string | null, projectName: string): Deployment {
  const date = timestamp ? new Date(timestamp).toISOString() : new Date(0).toISOString();
  return {
    id: `dep-${Math.random().toString(36).substr(2, 9)}`,
    date,
    commitMessage: timestamp ? 'Last activity' : 'No recent activity',
    status: 'success',
    branch: 'main',
    author: 'calvinorr',
    duration: '45s'
  };
}

// Transform API response to ProjectData format
interface APIProject {
  id: string;
  name: string;
  path: string;
  repoSlug: string | null;
  vercelProject: string | null;
  status: 'active' | 'redundant';
  source?: 'scanner' | 'github';
  description?: string | null;
  language?: string | null;
  htmlUrl?: string | null;
  lastCommitAt?: string | Date | null;
  lastDeploymentAt?: string | Date | null;
  isPinned?: boolean;
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

  // Use real timestamps - prefer lastCommitAt, fallback to lastDeploymentAt
  const lastActivityTimestamp = p.lastCommitAt || p.lastDeploymentAt || null;

  return {
    id: p.id,
    name: p.name,
    description: p.description || `Project at ${p.path}`,
    category: ProjectCategory.All, // No auto-inference, start blank
    status: p.status,
    repoUrl: p.repoSlug ? `github.com/${p.repoSlug}` : '',
    repoSlug: p.repoSlug,
    vercelUrl: p.vercelProject ? `${p.vercelProject}.vercel.app` : undefined,
    vercelProject: p.vercelProject,
    htmlUrl: p.htmlUrl,
    path: p.path,
    techStack,
    framework,
    database: p.tech?.primaryDB || undefined,
    backend: p.tech?.primaryAuth || undefined,
    isPinned: p.isPinned || false,
    lastCommitAt: p.lastCommitAt ? new Date(p.lastCommitAt) : null,
    lastDeploymentAt: p.lastDeploymentAt ? new Date(p.lastDeploymentAt) : null,
    lastDeployment: createDeploymentFromTimestamp(lastActivityTimestamp, p.name),
    recentDeployments: [],
    actions: [],
    commitActivity: generateEmptyActivity(90),
    deploymentActivity: generateEmptyActivity(90)
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
