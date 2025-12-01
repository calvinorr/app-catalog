import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, techStackSnapshots } from '@/lib/schema';

export const dynamic = 'force-dynamic';

/**
 * Cleanup endpoint - triggers a full re-sync from GitHub
 * This will re-fetch all repos and re-run tech detection with improved logic
 */
export async function POST() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    // Count existing data before cleanup
    const existingProjects = await db.select().from(projects);
    const existingTech = await db.select().from(techStackSnapshots);

    // Trigger GitHub sync (the sync route handles upserts)
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
    const syncResponse = await fetch(`${baseUrl}/api/github/sync`, {
      method: 'POST',
    });

    if (!syncResponse.ok) {
      throw new Error('GitHub sync failed');
    }

    const syncResult = await syncResponse.json();

    // Get updated counts
    const updatedProjects = await db.select().from(projects);
    const updatedTech = await db.select().from(techStackSnapshots);

    // Count projects with improved data
    const withDescription = updatedProjects.filter(p => p.description && !p.description.includes('tooling')).length;
    const withLanguage = updatedProjects.filter(p => p.language).length;
    const withTech = updatedTech.length;

    return NextResponse.json({
      ok: true,
      message: 'Cleanup completed successfully',
      before: {
        projects: existingProjects.length,
        techSnapshots: existingTech.length,
      },
      after: {
        projects: updatedProjects.length,
        techSnapshots: updatedTech.length,
        withDescription,
        withLanguage,
        withTech,
      },
      syncResult,
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check current data quality stats
 */
export async function GET() {
  try {
    const allProjects = await db.select().from(projects);
    const allTech = await db.select().from(techStackSnapshots);

    // Data quality metrics
    const metrics = {
      total: allProjects.length,
      withDescription: allProjects.filter(p => p.description && p.description.trim() !== '').length,
      withLanguage: allProjects.filter(p => p.language).length,
      withTechSnapshot: allTech.length,
      frameworks: {} as Record<string, number>,
      databases: {} as Record<string, number>,
      languages: {} as Record<string, number>,
    };

    // Count frameworks
    allTech.forEach(t => {
      if (t.primaryFramework) {
        metrics.frameworks[t.primaryFramework] = (metrics.frameworks[t.primaryFramework] || 0) + 1;
      }
    });

    // Count databases
    allTech.forEach(t => {
      if (t.primaryDB) {
        metrics.databases[t.primaryDB] = (metrics.databases[t.primaryDB] || 0) + 1;
      }
    });

    // Count languages
    allProjects.forEach(p => {
      if (p.language) {
        metrics.languages[p.language] = (metrics.languages[p.language] || 0) + 1;
      }
    });

    return NextResponse.json({
      ok: true,
      metrics,
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
