import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { activityItems, projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { shouldUseMockData } from '@/lib/devMode';
import { MOCK_ACTIVITY } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Dev mode: return mock data
  if (shouldUseMockData()) {
    return NextResponse.json({ activity: MOCK_ACTIVITY, devMode: true });
  }

  try {
    // Use LEFT JOIN to get project names efficiently (fixes N+1 query)
    const results = await db
      .select({
        id: activityItems.id,
        projectId: activityItems.projectId,
        type: activityItems.type,
        timestamp: activityItems.timestamp,
        title: activityItems.title,
        url: activityItems.url,
        metadata: activityItems.metadata,
        projectName: projects.name
      })
      .from(activityItems)
      .leftJoin(projects, eq(activityItems.projectId, projects.id));

    return NextResponse.json({ activity: results });
  } catch (error) {
    console.error('Database error, falling back to mock data:', error);
    return NextResponse.json({ activity: MOCK_ACTIVITY, devMode: true, fallback: true });
  }
}
