import { NextResponse } from 'next/server';
import { db } from '../../lib/db';
import { projects, techStackSnapshots } from '../../lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const data = await db.select().from(projects);

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
}
