import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  link?: {
    type: string;
    repo: string;
    org?: string;
    repoId?: number;
  };
  latestDeployments?: Array<{
    uid: string;
    url: string;
    state: string;
    created: number;
  }>;
}

interface VercelProjectsResponse {
  projects: VercelProject[];
  pagination?: {
    count: number;
    next?: number;
    prev?: number;
  };
}

export async function GET(request: Request) {
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelTeam = process.env.VERCEL_TEAM;

  if (!vercelToken) {
    return NextResponse.json(
      { error: 'VERCEL_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    const allProjects: VercelProject[] = [];
    let nextCursor: number | undefined = undefined;
    const limit = 100; // Max per page

    // Handle pagination
    do {
      const url = new URL('https://api.vercel.com/v9/projects');
      url.searchParams.set('limit', limit.toString());
      if (nextCursor) {
        url.searchParams.set('until', nextCursor.toString());
      }
      if (vercelTeam) {
        url.searchParams.set('teamId', vercelTeam);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vercel API error: ${response.status} ${errorText}`);
      }

      const data: VercelProjectsResponse = await response.json();
      allProjects.push(...data.projects);

      nextCursor = data.pagination?.next;
    } while (nextCursor);

    return NextResponse.json({
      ok: true,
      count: allProjects.length,
      projects: allProjects.map(p => ({
        id: p.id,
        name: p.name,
        framework: p.framework,
        repo: p.link?.repo,
        repoOrg: p.link?.org,
        latestDeployments: p.latestDeployments?.map(d => ({
          uid: d.uid,
          url: d.url,
          state: d.state,
          created: d.created
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching Vercel projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Vercel projects', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
