import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, techStackSnapshots } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { shouldUseMockData } from '@/lib/devMode';
import { MOCK_PROJECTS } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Dev mode: return mock data
  if (shouldUseMockData()) {
    return NextResponse.json({ projects: MOCK_PROJECTS, devMode: true });
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

    // Join with tech stack snapshots
    const withTech = await Promise.all(
      data.map(async (p) => {
        const tech = await db
          .select()
          .from(techStackSnapshots)
          .where(eq(techStackSnapshots.projectId, p.id))
          .limit(1);
        return {
          ...p,
          tech: tech[0] || null
        };
      })
    );

    return NextResponse.json({ projects: withTech });
  } catch (error) {
    console.error('Database error, falling back to mock data:', error);
    return NextResponse.json({ projects: MOCK_PROJECTS, devMode: true, fallback: true });
  }
}
