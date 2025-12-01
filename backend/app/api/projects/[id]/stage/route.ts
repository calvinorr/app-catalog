import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const stage = body.stage as 'final' | 'beta' | 'alpha' | 'indev' | null;

  // Validate stage value
  if (stage !== null && !['final', 'beta', 'alpha', 'indev'].includes(stage)) {
    return NextResponse.json(
      { error: 'Invalid stage value. Must be one of: final, beta, alpha, indev' },
      { status: 400 }
    );
  }

  const now = new Date();

  await db
    .update(projects)
    .set({ stage, updatedAt: now })
    .where(eq(projects.id, params.id));

  return NextResponse.json({ ok: true });
}
