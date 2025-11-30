import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { projects } from '../../../../lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const status = body.status as 'active' | 'redundant';
  const now = new Date();

  await db
    .update(projects)
    .set({ status, updatedAt: now })
    .where(eq(projects.id, params.id));

  return NextResponse.json({ ok: true });
}
