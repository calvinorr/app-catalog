import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { projects, activityItems } from '../../../lib/schema';
import { eq } from 'drizzle-orm';

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

async function fetchLatestCommit(repoSlug: string): Promise<CommitResult | null> {
  if (!GITHUB_TOKEN) return null;
  const res = await fetch(`https://api.github.com/repos/${repoSlug}/commits?per_page=1`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json'
    }
  });
  if (!res.ok) return null;
  const data = (await res.json()) as CommitResult[];
  return data[0] || null;
}

async function fetchLatestDeployment(vercelProject: string): Promise<VercelDeployment | null> {
  if (!VERCEL_TOKEN) return null;
  const params = new URLSearchParams({
    app: vercelProject,
    limit: '1'
  });
  if (VERCEL_TEAM) params.append('teamId', VERCEL_TEAM);

  const res = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`
    }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.deployments && data.deployments[0]) || null;
}

export async function POST() {
  const list = await db.select().from(projects);
  let updated = 0;
  const now = new Date();

  for (const project of list) {
    // GitHub
    if (project.repoSlug) {
      try {
        const commit = await fetchLatestCommit(project.repoSlug);
        if (commit) {
          await db
            .insert(activityItems)
            .values({
              id: `${project.id}-commit`,
              projectId: project.id,
              type: 'commit',
              timestamp: new Date(commit.commit.author.date),
              title: commit.commit.message,
              url: commit.html_url,
              metadata: JSON.stringify({
                sha: commit.sha,
                author: commit.commit.author.name
              })
            })
            .onConflictDoUpdate({
              target: activityItems.id,
              set: {
                timestamp: new Date(commit.commit.author.date),
                title: commit.commit.message,
                url: commit.html_url,
                metadata: JSON.stringify({
                  sha: commit.sha,
                  author: commit.commit.author.name
                })
              }
            });
          updated++;
        }
      } catch (err) {
        console.error('GitHub refresh failed', err);
      }
    }

    // Vercel
    if (project.vercelProject) {
      try {
        const deploy = await fetchLatestDeployment(project.vercelProject);
        if (deploy) {
          await db
            .insert(activityItems)
            .values({
              id: `${project.id}-deploy`,
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
            .onConflictDoUpdate({
              target: activityItems.id,
              set: {
                timestamp: new Date(deploy.createdAt),
                title: `Deployment ${deploy.state}`,
                url: `https://${deploy.url}`,
                metadata: JSON.stringify({
                  uid: deploy.uid,
                  state: deploy.state
                })
              }
            });
          updated++;
        }
      } catch (err) {
        console.error('Vercel refresh failed', err);
      }
    }
  }

  return NextResponse.json({ ok: true, updated, runAt: now.toISOString() });
}
