import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, techStackSnapshots } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface IncomingProject {
  name: string;
  path: string;
  packageManager: string | null;
  dependencies: string[];
  configFiles: string[];
  repoSlug: string | null;
  vercelProject: string | null;
  status: 'active' | 'redundant';
  tech: {
    primaryFramework: string | null;
    backendFramework: string | null;
    primaryDB: string | null;
    primaryAuth: string | null;
    tags: string[];
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const payload: IncomingProject[] = body.projects || [];
  const now = new Date();

  for (const project of payload) {
    const id = crypto.randomUUID();
    await db
      .insert(projects)
      .values({
        id,
        name: project.name,
        path: project.path,
        repoSlug: project.repoSlug || null,
        vercelProject: project.vercelProject || null,
        status: project.status,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: projects.path,
        set: {
          name: project.name,
          repoSlug: project.repoSlug || null,
          vercelProject: project.vercelProject || null,
          status: project.status,
          updatedAt: now
        }
      });

    // Fetch existing project to get id if conflict
    const existing = await db.select().from(projects).where(eq(projects.path, project.path)).limit(1);
    const projectId = existing[0]?.id || id;

    await db
      .insert(techStackSnapshots)
      .values({
        id: crypto.randomUUID(),
        projectId,
        primaryFramework: project.tech.primaryFramework,
        backendFramework: project.tech.backendFramework,
        primaryDB: project.tech.primaryDB,
        primaryAuth: project.tech.primaryAuth,
        tags: JSON.stringify(project.tech.tags || []),
        lastScannedAt: now
      })
      .onConflictDoUpdate({
        target: techStackSnapshots.projectId,
        set: {
          primaryFramework: project.tech.primaryFramework,
          backendFramework: project.tech.backendFramework,
          primaryDB: project.tech.primaryDB,
          primaryAuth: project.tech.primaryAuth,
          tags: JSON.stringify(project.tech.tags || []),
          lastScannedAt: now
        }
      });
  }

  return NextResponse.json({ ok: true, count: payload.length });
}
