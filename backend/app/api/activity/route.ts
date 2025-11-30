import { NextResponse } from 'next/server';
import { db } from '../../lib/db';
import { activityItems, projects } from '../../lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
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
}
