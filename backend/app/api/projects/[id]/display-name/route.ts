import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { displayName } = body;

    if (typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'displayName must be a string' },
        { status: 400 }
      );
    }

    // Update the project's display name (empty string clears it)
    const result = await db
      .update(projects)
      .set({
        displayName: displayName.trim() || null,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning({ displayName: projects.displayName });

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      displayName: result[0].displayName
    });
  } catch (error) {
    console.error('Failed to update display name:', error);
    return NextResponse.json(
      { error: 'Failed to update display name' },
      { status: 500 }
    );
  }
}
