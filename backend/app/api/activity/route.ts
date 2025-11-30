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
    const items = await db.select().from(activityItems);

    const withNames = await Promise.all(
      items.map(async (item) => {
        const proj = await db.select().from(projects).where(eq(projects.id, item.projectId)).limit(1);
        return {
          ...item,
          projectName: proj[0]?.name
        };
      })
    );

    return NextResponse.json({ activity: withNames });
  } catch (error) {
    console.error('Database error, falling back to mock data:', error);
    return NextResponse.json({ activity: MOCK_ACTIVITY, devMode: true, fallback: true });
  }
}
