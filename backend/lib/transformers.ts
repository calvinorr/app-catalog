/**
 * Transforms database records into frontend ProjectData format
 */

import { projects, techStackSnapshots, activityItems } from './schema';

interface ActivityPoint {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  status?: 'success' | 'failed' | 'neutral';
}

interface Deployment {
  id: string;
  date: string;
  commitMessage: string;
  status: 'success' | 'failed' | 'building' | 'queued';
  branch: string;
  author: string;
  duration: string;
}

interface GithubAction {
  name: string;
  status: 'passing' | 'failing' | 'running';
  lastRun: string;
}

type DBProject = typeof projects.$inferSelect;
type DBTechStack = typeof techStackSnapshots.$inferSelect;
type DBActivity = typeof activityItems.$inferSelect;

export function generateActivityPoints(
  activities: DBActivity[],
  type: 'commit' | 'deployment',
  days = 90
): ActivityPoint[] {
  const now = new Date();
  const points: ActivityPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dateStr = date.toISOString().split('T')[0];

    // Count activities for this day
    const dayActivities = activities.filter((a) => {
      const actDate = new Date(a.timestamp);
      actDate.setHours(0, 0, 0, 0);
      return actDate.toISOString().split('T')[0] === dateStr;
    });

    const count = dayActivities.length;

    // Calculate level (0-4 based on count)
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) level = 1;
    if (count >= 3) level = 2;
    if (count >= 5) level = 3;
    if (count >= 10) level = 4;

    points.push({
      date: dateStr,
      count,
      level,
      status: type === 'deployment' ? 'neutral' : undefined,
    });
  }

  return points;
}

function inferCategoryFromLanguage(language: string | null): string {
  if (!language) return 'Unknown';

  const lang = language.toLowerCase();

  // Frontend languages
  if (['typescript', 'javascript', 'html', 'css', 'scss', 'vue', 'svelte'].includes(lang)) {
    return 'Frontend';
  }

  // Backend languages
  if (['python', 'go', 'rust', 'java', 'kotlin', 'c#', 'ruby', 'php', 'c', 'c++'].includes(lang)) {
    return 'Backend';
  }

  // Shell/config usually means tooling/scripts
  if (['shell', 'bash', 'dockerfile', 'makefile'].includes(lang)) {
    return 'Tooling';
  }

  return 'Unknown';
}

function humanizeProjectName(name: string): string {
  // Convert kebab-case or snake_case to Title Case
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferCategory(framework: string | null, tags: string[], language: string | null = null): string {
  // If we have a framework, use framework-based inference
  if (framework) {
    const lowerFramework = framework.toLowerCase();
    const lowerTags = tags.map(t => t.toLowerCase());

    if (lowerFramework.includes('next.js') || lowerFramework.includes('nextjs')) {
      return 'Fullstack';
    }
    if (lowerFramework.includes('react') || lowerFramework.includes('vue') || lowerFramework.includes('vite') || lowerFramework.includes('svelte')) {
      return 'Frontend';
    }
    if (lowerFramework.includes('express') || lowerFramework.includes('fastify') || lowerFramework.includes('hono')) {
      return 'Backend';
    }
    if (lowerTags.includes('api') || lowerTags.includes('backend')) {
      return 'Backend';
    }

    return 'Fullstack';
  }

  // No framework detected - fall back to language-based inference
  return inferCategoryFromLanguage(language);
}

function generateDescription(
  project: DBProject,
  framework: string | null,
  database: string | null,
  category: string
): string {
  // If project has a description, use it
  if (project.description) return project.description;

  // Build contextual description
  const humanName = humanizeProjectName(project.name);

  // If we have tech info, include it
  const techParts: string[] = [];
  if (framework) techParts.push(framework);
  if (database) techParts.push(database);

  if (techParts.length > 0) {
    return `${humanName} - ${techParts.join(' + ')} project`;
  }

  // If we have language info, use it
  if (project.language) {
    return `${humanName} - ${project.language} project`;
  }

  // Last resort: just the humanized name
  return humanName;
}

export function transformProject(
  project: DBProject,
  tech: DBTechStack | null,
  commitActivity: ActivityPoint[],
  deploymentActivity: ActivityPoint[],
  recentActivityItems: DBActivity[]
): any {
  const tags = tech?.tags ? JSON.parse(tech.tags) : [];
  const category = inferCategory(tech?.primaryFramework || null, tags, project.language);

  // Build tech stack array
  const techStack: string[] = [];
  if (tech?.primaryFramework) techStack.push(tech.primaryFramework);
  if (tech?.primaryDB) techStack.push(tech.primaryDB);
  if (tech?.primaryAuth) techStack.push(tech.primaryAuth);
  tags.forEach((tag: string) => {
    if (!techStack.includes(tag)) techStack.push(tag);
  });

  // Find most recent deployment activity
  const deployments = recentActivityItems.filter((a) => a.type === 'deployment');
  const lastDeploymentItem = deployments.length > 0 ? deployments[0] : null;

  // Create lastDeployment object
  const lastDeployment: Deployment = {
    id: lastDeploymentItem?.id || 'none',
    date: (project.lastDeploymentAt || project.lastCommitAt || project.updatedAt).toISOString(),
    commitMessage: lastDeploymentItem?.title || 'No recent deployments',
    status: 'success',
    branch: 'main',
    author: 'developer',
    duration: '0s',
  };

  // Create recentDeployments array from deployment activity items
  const recentDeployments: Deployment[] = deployments.slice(0, 10).map((d) => ({
    id: d.id,
    date: d.timestamp.toISOString(),
    commitMessage: d.title,
    status: 'success' as const,
    branch: 'main',
    author: 'developer',
    duration: '0s',
  }));

  // GitHub Actions placeholder
  const actions: GithubAction[] = [];

  const framework = tech?.primaryFramework || project.language || null;
  const database = tech?.primaryDB || null;
  const description = generateDescription(project, framework, database, category);

  return {
    id: project.id,
    name: project.name,
    description,
    category,
    status: project.status,
    stage: project.stage,
    repoUrl: project.htmlUrl || (project.repoSlug ? `https://github.com/${project.repoSlug}` : ''),
    repoSlug: project.repoSlug,
    vercelUrl: project.vercelProject ? `https://${project.vercelProject}.vercel.app` : undefined,
    vercelProject: project.vercelProject,
    lastDeploymentAt: project.lastDeploymentAt,
    lastCommitAt: project.lastCommitAt,
    techStack,
    language: project.language,
    backend: database || undefined,
    database: database || undefined,
    framework: framework || 'None detected',
    isPinned: project.isPinned,
    lastDeployment,
    recentDeployments,
    actions,
    commitActivity,
    deploymentActivity,
  };
}
