import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, activityItems } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CommitResult = {
  sha: string;
  commit: {
    message: string;
    author: { date: string; name: string };
  };
  html_url: string;
};

type VercelDeployment = {
  uid: string;
  state: string;
  url: string;
  createdAt: number;
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM = process.env.VERCEL_TEAM;

async function fetchCommits(repoSlug: string, count = 100): Promise<CommitResult[]> {
  if (!GITHUB_TOKEN) return [];
  const res = await fetch(`https://api.github.com/repos/${repoSlug}/commits?per_page=${count}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json'
    }
  });
  if (!res.ok) return [];
  const data = (await res.json()) as CommitResult[];
  return data || [];
}

async function fetchDeployments(vercelProject: string, count = 50): Promise<VercelDeployment[]> {
  if (!VERCEL_TOKEN) return [];
  const params = new URLSearchParams({
    app: vercelProject,
    limit: String(count)
  });
  if (VERCEL_TEAM) params.append('teamId', VERCEL_TEAM);

  const res = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`
    }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.deployments || [];
}

export async function POST() {
  const list = await db.select().from(projects);
  let updated = 0;
  const now = new Date();

  for (const project of list) {
    // GitHub - fetch last 100 commits
    if (project.repoSlug) {
      try {
        const commits = await fetchCommits(project.repoSlug, 100);
        for (const commit of commits) {
          // Use SHA in ID to allow multiple commits per project
          await db
            .insert(activityItems)
            .values({
              id: `${project.id}-commit-${commit.sha.substring(0, 8)}`,
              projectId: project.id,
              type: 'commit',
              timestamp: new Date(commit.commit.author.date),
              title: commit.commit.message.split('\n')[0], // First line only
              url: commit.html_url,
              metadata: JSON.stringify({
                sha: commit.sha,
                author: commit.commit.author.name
              })
            })
            .onConflictDoNothing(); // Preserve existing, don't update
          updated++;
        }
      } catch (err) {
        console.error('GitHub refresh failed for', project.repoSlug, err);
      }
    }

    // Vercel - fetch last 50 deployments
    if (project.vercelProject) {
      try {
        const deployments = await fetchDeployments(project.vercelProject, 50);
        for (const deploy of deployments) {
          // Use UID in ID to allow multiple deployments per project
          await db
            .insert(activityItems)
            .values({
              id: `${project.id}-deploy-${deploy.uid.substring(0, 8)}`,
              projectId: project.id,
              type: 'deployment',
              timestamp: new Date(deploy.createdAt),
              title: `Deployment ${deploy.state}`,
              url: `https://${deploy.url}`,
              metadata: JSON.stringify({
                uid: deploy.uid,
                state: deploy.state
              })
            })
            .onConflictDoNothing(); // Preserve existing
          updated++;
        }
      } catch (err) {
        console.error('Vercel refresh failed for', project.vercelProject, err);
      }
    }
  }

  return NextResponse.json({ ok: true, updated, runAt: now.toISOString() });
}
