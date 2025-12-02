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

// Framework category mappings
const FULLSTACK_FRAMEWORKS = ['next.js', 'nextjs', 'nuxt', 'remix', 'sveltekit', 'astro'];
const FRONTEND_FRAMEWORKS = ['react', 'vue', 'vite', 'svelte', 'angular'];
const BACKEND_FRAMEWORKS = ['express', 'fastify', 'hono', 'nestjs', 'koa', 'elysia'];
const MOBILE_FRAMEWORKS = ['react native', 'expo'];

function inferCategory(
  framework: string | null,
  backendFramework: string | null,
  tags: string[],
  language: string | null = null
): string {
  const lowerTags = tags.map(t => t.toLowerCase());

  // Tag-based overrides (highest priority)
  if (lowerTags.some(t => ['cli', 'tooling', 'script', 'automation', 'devtool'].includes(t))) {
    return 'Tooling';
  }
  if (lowerTags.some(t => ['mobile', 'ios', 'android', 'react-native'].includes(t))) {
    return 'Mobile';
  }

  // Check for mobile frameworks
  if (framework) {
    const lowerFW = framework.toLowerCase();
    if (MOBILE_FRAMEWORKS.some(m => lowerFW.includes(m))) {
      return 'Mobile';
    }
  }

  // If we have both frontend and backend frameworks -> Fullstack
  if (framework && backendFramework) {
    return 'Fullstack';
  }

  // If we only have a backend framework -> Backend
  if (backendFramework && !framework) {
    const lowerBackend = backendFramework.toLowerCase();
    if (BACKEND_FRAMEWORKS.some(b => lowerBackend.includes(b))) {
      return 'Backend';
    }
  }

  // If we have a frontend framework, use framework-based inference
  if (framework) {
    const lowerFramework = framework.toLowerCase();

    // Check fullstack frameworks
    if (FULLSTACK_FRAMEWORKS.some(f => lowerFramework.includes(f))) {
      return 'Fullstack';
    }

    // Check frontend frameworks
    if (FRONTEND_FRAMEWORKS.some(f => lowerFramework.includes(f))) {
      return 'Frontend';
    }
  }

  // Tag-based fallbacks
  if (lowerTags.some(t => ['api', 'graphql', 'rest', 'server', 'backend'].includes(t))) {
    return 'Backend';
  }

  // No framework detected - fall back to language-based inference
  return inferCategoryFromLanguage(language);
}

// Pattern keywords for project type inference
const PROJECT_TYPE_PATTERNS: Record<string, string> = {
  'api': 'API service',
  'cli': 'CLI tool',
  'dashboard': 'Dashboard application',
  'admin': 'Admin panel',
  'auth': 'Authentication service',
  'chat': 'Chat application',
  'bot': 'Bot application',
  'cms': 'Content management system',
  'ecom': 'E-commerce application',
  'shop': 'E-commerce application',
  'blog': 'Blog platform',
  'portfolio': 'Portfolio site',
  'landing': 'Landing page',
  'docs': 'Documentation site',
  'ui': 'UI component library',
  'lib': 'Library',
  'sdk': 'SDK',
  'template': 'Project template',
  'starter': 'Starter kit',
  'boilerplate': 'Project boilerplate',
};

function inferProjectType(name: string): string | null {
  const lowerName = name.toLowerCase();
  for (const [pattern, type] of Object.entries(PROJECT_TYPE_PATTERNS)) {
    if (lowerName.includes(pattern)) {
      return type;
    }
  }
  return null;
}

function generateDescription(
  project: DBProject,
  framework: string | null,
  backendFramework: string | null,
  database: string | null,
  category: string
): string {
  // If project has a description, use it
  if (project.description) return project.description;

  const humanName = humanizeProjectName(project.name);
  const projectType = inferProjectType(project.name);

  // Build tech parts
  const techParts: string[] = [];
  if (framework) techParts.push(framework);
  if (backendFramework) techParts.push(backendFramework);
  if (database) techParts.push(database);

  // If we have a detected project type, use a more descriptive format
  if (projectType) {
    if (techParts.length > 0) {
      return `${projectType} built with ${techParts.join(' and ')}`;
    }
    if (project.language) {
      return `${projectType} built with ${project.language}`;
    }
    return projectType;
  }

  // If we have tech info, include it
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
  const backendFramework = tech?.backendFramework || null;
  const category = inferCategory(tech?.primaryFramework || null, backendFramework, tags, project.language);

  // Build tech stack array
  const techStack: string[] = [];
  if (tech?.primaryFramework) techStack.push(tech.primaryFramework);
  if (tech?.backendFramework) techStack.push(tech.backendFramework);
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
  const description = generateDescription(project, framework, backendFramework, database, category);

  return {
    id: project.id,
    name: project.name,
    displayName: project.displayName || null,
    description,
    category,
    status: project.status,
    stage: project.stage,
    repoUrl: project.htmlUrl || (project.repoSlug ? `https://github.com/${project.repoSlug}` : ''),
    repoSlug: project.repoSlug,
    vercelUrl: project.vercelUrl || undefined,
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
