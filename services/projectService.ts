import { ProjectData, ProjectStatus, ActivityItem } from '../types';
import { MOCK_PROJECTS } from '../data';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

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

export async function fetchProjects(): Promise<ProjectData[]> {
  const res = await safeFetch(`${API_BASE}/projects`);
  if (!res) return MOCK_PROJECTS;
  try {
    const data = await res.json();
    return data.projects as ProjectData[];
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
    return data.activity as ActivityItem[];
  } catch (err) {
    console.warn('Failed to parse activity response, using fallback.', err);
    return [];
  }
}
