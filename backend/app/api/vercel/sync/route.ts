import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  link?: {
    type: string;
    repo: string;
    org?: string;
    repoId?: number;
  };
  latestDeployments?: Array<{
    uid: string;
    url: string;
    state: string;
    created: number;
  }>;
}

interface VercelProjectsResponse {
  projects: VercelProject[];
  pagination?: {
    count: number;
    next?: number;
    prev?: number;
  };
}

export async function POST(request: Request) {
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelTeam = process.env.VERCEL_TEAM;

  if (!vercelToken) {
    return NextResponse.json(
      { error: 'VERCEL_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    // Fetch all Vercel projects with pagination
    const allProjects: VercelProject[] = [];
    let nextCursor: number | undefined = undefined;
    const limit = 100;

    do {
      const url = new URL('https://api.vercel.com/v9/projects');
      url.searchParams.set('limit', limit.toString());
      if (nextCursor) {
        url.searchParams.set('until', nextCursor.toString());
      }
      if (vercelTeam) {
        url.searchParams.set('teamId', vercelTeam);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vercel API error: ${response.status} ${errorText}`);
      }

      const data: VercelProjectsResponse = await response.json();
      allProjects.push(...data.projects);

      nextCursor = data.pagination?.next;
    } while (nextCursor);

    // Sync projects to database
    const now = new Date();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const vercelProject of allProjects) {
      // Extract repo slug from link (e.g., "owner/repo")
      const repoSlug = vercelProject.link?.repo
        ? `${vercelProject.link.org || ''}/${vercelProject.link.repo}`.replace(/^\//, '')
        : null;

      // Get latest deployment URL and timestamp
      const latestDeployment = vercelProject.latestDeployments?.[0];
      const deploymentUrl = latestDeployment?.url
        ? `https://${latestDeployment.url}`
        : null;
      const lastDeploymentAt = latestDeployment?.created
        ? new Date(latestDeployment.created)
        : null;

      // Try to find existing project by name or repo slug
      const existingProjects = await db
        .select()
        .from(projects)
        .where(
          or(
            eq(projects.name, vercelProject.name),
            repoSlug ? eq(projects.repoSlug, repoSlug) : undefined
          )
        )
        .limit(1);

      const existing = existingProjects[0];

      if (existing) {
        // Update existing project with Vercel info
        await db
          .update(projects)
          .set({
            vercelProject: vercelProject.id,
            repoSlug: repoSlug || existing.repoSlug,
            lastDeploymentAt,
            updatedAt: now
          })
          .where(eq(projects.id, existing.id));

        updated++;
      } else {
        // Create new project from Vercel data
        const newId = crypto.randomUUID();

        // Use a placeholder path since this is a Vercel-only project
        const placeholderPath = `/vercel/${vercelProject.name}`;

        try {
          await db.insert(projects).values({
            id: newId,
            name: vercelProject.name,
            path: placeholderPath,
            repoSlug: repoSlug,
            vercelProject: vercelProject.id,
            status: 'active',
            lastDeploymentAt,
            createdAt: now,
            updatedAt: now
          });
          created++;
        } catch (err) {
          // If path conflict (unlikely), skip this project
          console.warn(`Skipping duplicate Vercel project: ${vercelProject.name}`, err);
          skipped++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      synced: allProjects.length,
      created,
      updated,
      skipped,
      projects: allProjects.map(p => ({
        id: p.id,
        name: p.name,
        framework: p.framework,
        repo: p.link?.repo,
        latestDeploymentUrl: p.latestDeployments?.[0]?.url
      }))
    });
  } catch (error) {
    console.error('Error syncing Vercel projects:', error);
    return NextResponse.json(
      { error: 'Failed to sync Vercel projects', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
