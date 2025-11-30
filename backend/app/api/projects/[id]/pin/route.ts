import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get current project state
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, params.id))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Toggle isPinned
    const newIsPinned = !project.isPinned;
    const now = new Date();

    await db
      .update(projects)
      .set({ isPinned: newIsPinned, updatedAt: now })
      .where(eq(projects.id, params.id));

    return NextResponse.json({
      ok: true,
      isPinned: newIsPinned
    });
  } catch (error) {
    console.error('Error toggling pin status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle pin status' },
      { status: 500 }
    );
  }
}
