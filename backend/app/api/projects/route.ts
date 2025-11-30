import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, techStackSnapshots, activityItems } from '@/lib/schema';
import { eq, desc, sql, gte } from 'drizzle-orm';
import { shouldUseMockData } from '@/lib/devMode';
import { MOCK_PROJECTS } from '@/lib/mockData';
import { generateActivityPoints, transformProject } from '@/lib/transformers';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Dev mode: return mock data (transformed to match frontend format)
  if (shouldUseMockData()) {
    const transformedMocks = MOCK_PROJECTS.map((p) => {
      const tags = p.tech?.tags ? JSON.parse(p.tech.tags) : [];
      const techStack: string[] = [];
      if (p.tech?.primaryFramework) techStack.push(p.tech.primaryFramework);
      if (p.tech?.primaryDB) techStack.push(p.tech.primaryDB);
      if (p.tech?.primaryAuth) techStack.push(p.tech.primaryAuth);
      tags.forEach((tag: string) => {
        if (!techStack.includes(tag)) techStack.push(tag);
      });

      return {
        id: p.id,
        name: p.name,
        description: `A mock project`,
        category: p.tech?.primaryFramework?.includes('Next.js') ? 'Fullstack' : 'Frontend',
        status: p.status,
        repoUrl: p.repoSlug ? `https://github.com/${p.repoSlug}` : '',
        repoSlug: p.repoSlug,
        vercelUrl: p.vercelProject ? `https://${p.vercelProject}.vercel.app` : undefined,
        vercelProject: p.vercelProject,
        techStack,
        framework: p.tech?.primaryFramework || 'Unknown',
        database: p.tech?.primaryDB || undefined,
        backend: p.tech?.primaryDB || undefined,
        isPinned: false,
        lastDeployment: {
          id: 'mock-dep',
          date: p.updatedAt.toISOString(),
          commitMessage: 'Mock deployment',
          status: 'success' as const,
          branch: 'main',
          author: 'developer',
          duration: '30s',
        },
        recentDeployments: [],
        actions: [],
        commitActivity: p.commitActivity,
        deploymentActivity: p.deploymentActivity,
      };
    });
    return NextResponse.json({ projects: transformedMocks, devMode: true });
  }

  try {
    // Sort by: pinned first, then by COALESCE(lastDeploymentAt, lastCommitAt, updatedAt) DESC
    const data = await db
      .select()
      .from(projects)
      .orderBy(
        desc(projects.isPinned),
        desc(sql`COALESCE(${projects.lastDeploymentAt}, ${projects.lastCommitAt}, ${projects.updatedAt})`)
      );

    // Fetch all activity items for the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const allActivities = await db
      .select()
      .from(activityItems)
      .where(gte(activityItems.timestamp, ninetyDaysAgo))
      .orderBy(desc(activityItems.timestamp));

    // Transform projects with tech stack and activity data
    const transformedProjects = await Promise.all(
      data.map(async (p) => {
        // Get tech stack
        const tech = await db
          .select()
          .from(techStackSnapshots)
          .where(eq(techStackSnapshots.projectId, p.id))
          .limit(1);

        // Filter activities for this project
        const projectActivities = allActivities.filter((a) => a.projectId === p.id);
        const commits = projectActivities.filter((a) => a.type === 'commit');
        const deployments = projectActivities.filter((a) => a.type === 'deployment');

        // Generate activity points
        const commitActivity = generateActivityPoints(commits, 'commit', 90);
        const deploymentActivity = generateActivityPoints(deployments, 'deployment', 90);

        // Transform to frontend format
        return transformProject(
          p,
          tech[0] || null,
          commitActivity,
          deploymentActivity,
          projectActivities
        );
      })
    );

    return NextResponse.json({ projects: transformedProjects });
  } catch (error) {
    console.error('Database error, falling back to mock data:', error);
    return NextResponse.json({ projects: MOCK_PROJECTS, devMode: true, fallback: true });
  }
}
