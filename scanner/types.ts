export type ProjectStatus = 'active' | 'redundant';

export interface TechSnapshot {
  primaryFramework: string | null;
  primaryDB: string | null;
  primaryAuth: string | null;
  tags: string[];
}

export interface DetectedProject {
  name: string;
  path: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | null;
  dependencies: string[];
  configFiles: string[];
  repoSlug: string | null;
  vercelProject: string | null;
  status: ProjectStatus;
  tech: TechSnapshot;
}

export interface ScannerConfig {
  rootPath: string;
  apiUrl?: string;
  apiToken?: string;
}
