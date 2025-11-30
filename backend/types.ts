
export enum ProjectCategory {
  All = 'All',
  Frontend = 'Frontend',
  Backend = 'Backend',
  Fullstack = 'Fullstack',
  Tooling = 'Tooling',
  Mobile = 'Mobile'
}

export type DeploymentStatus = 'success' | 'failed' | 'building' | 'queued';
export type ViewOption = 'dashboard' | 'analysis';
export type SortOption = 'recent' | 'status' | 'alpha';
export type ProjectStatus = 'active' | 'redundant';
export type ActivityType = 'commit' | 'deployment';
export type DatabaseFilter = 'all' | 'yes' | 'no';

export interface Deployment {
  id: string;
  date: string; // ISO string
  commitMessage: string;
  status: DeploymentStatus;
  branch: string;
  author: string;
  duration: string;
}

export interface GithubAction {
  name: string;
  status: 'passing' | 'failing' | 'running';
  lastRun: string;
}

export interface ActivityPoint {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 is empty, 4 is high activity
  status?: 'success' | 'failed' | 'neutral'; // specific for deployment views
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  repoUrl: string;
  vercelUrl?: string;
  techStack: string[];
  backend?: string;
  database?: string;
  framework: string;
  isPinned?: boolean;
  lastDeployment: Deployment;
  recentDeployments: Deployment[];
  actions: GithubAction[];
  commitActivity: ActivityPoint[]; // Last 90 days of commits
  deploymentActivity: ActivityPoint[]; // Last 90 days of deployments
}

export interface ActivityItem {
  id: string;
  projectId: string;
  projectName?: string;
  type: ActivityType;
  timestamp: string;
  title: string;
  url?: string | null;
  metadata?: Record<string, unknown>;
}
