import { describe, it, expect } from 'vitest';
import { ProjectCategory, ProjectData, ProjectStatus } from '../types';

const makeProject = (overrides: Partial<ProjectData> = {}): ProjectData => ({
  id: '1',
  name: 'test',
  description: 'desc',
  category: ProjectCategory.Frontend,
  status: 'active',
  repoUrl: 'github.com/test/repo',
  techStack: ['React'],
  framework: 'React',
  lastDeployment: {
    id: 'd1',
    date: new Date().toISOString(),
    commitMessage: 'msg',
    status: 'success',
    branch: 'main',
    author: 'me',
    duration: '10s'
  },
  recentDeployments: [],
  actions: [],
  commitActivity: [],
  deploymentActivity: [],
  ...overrides
});

const applyFilters = (projects: ProjectData[], status: ProjectStatus | 'all', search: string) => {
  const lower = search.toLowerCase();
  return projects.filter((p) => {
    if (status !== 'all' && p.status !== status) return false;
    if (!search) return true;
    return (
      p.name.toLowerCase().includes(lower) ||
      p.repoUrl.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.techStack.some((t) => t.toLowerCase().includes(lower))
    );
  });
};

describe('status and search filtering', () => {
  const projects = [
    makeProject({ id: '1', name: 'active-one', status: 'active', repoUrl: 'github.com/foo/one' }),
    makeProject({ id: '2', name: 'redundant-two', status: 'redundant', repoUrl: 'github.com/foo/two' })
  ];

  it('filters by status', () => {
    const active = applyFilters(projects, 'active', '');
    expect(active.map((p) => p.id)).toEqual(['1']);
    const redundant = applyFilters(projects, 'redundant', '');
    expect(redundant.map((p) => p.id)).toEqual(['2']);
  });

  it('filters by search across repo and tech', () => {
    const byRepo = applyFilters(projects, 'all', 'two');
    expect(byRepo.map((p) => p.id)).toEqual(['2']);
    const byTech = applyFilters(projects, 'all', 'react');
    expect(byTech.length).toBe(2);
  });
});
