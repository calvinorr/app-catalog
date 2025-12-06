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

// Process a single project's GitHub commits
async function processGitHubCommits(project: { id: string; repoSlug: string | null }): Promise<number> {
  if (!project.repoSlug) return 0;

  try {
    const commits = await fetchCommits(project.repoSlug, 100);
    let count = 0;

    // Insert commits in batches for better performance
    for (const commit of commits) {
      await db
        .insert(activityItems)
        .values({
          id: `${project.id}-commit-${commit.sha.substring(0, 8)}`,
          projectId: project.id,
          type: 'commit',
          timestamp: new Date(commit.commit.author.date),
          title: commit.commit.message.split('\n')[0],
          url: commit.html_url,
          metadata: JSON.stringify({
            sha: commit.sha,
            author: commit.commit.author.name
          })
        })
        .onConflictDoUpdate({
          target: activityItems.id,
          set: {
            title: commit.commit.message.split('\n')[0],
            timestamp: new Date(commit.commit.author.date),
            url: commit.html_url,
            metadata: JSON.stringify({
              sha: commit.sha,
              author: commit.commit.author.name
            })
          }
        });
      count++;
    }
    return count;
  } catch (err) {
    console.error('GitHub refresh failed for', project.repoSlug, err);
    return 0;
  }
}

// Process a single project's Vercel deployments
async function processVercelDeployments(project: { id: string; vercelProject: string | null }): Promise<number> {
  if (!project.vercelProject) return 0;

  try {
    const deployments = await fetchDeployments(project.vercelProject, 50);
    let count = 0;

    for (const deploy of deployments) {
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
        .onConflictDoUpdate({
          target: activityItems.id,
          set: {
            title: `Deployment ${deploy.state}`,
            timestamp: new Date(deploy.createdAt),
            url: `https://${deploy.url}`,
            metadata: JSON.stringify({
              uid: deploy.uid,
              state: deploy.state
            })
          }
        });
      count++;
    }
    return count;
  } catch (err) {
    console.error('Vercel refresh failed for', project.vercelProject, err);
    return 0;
  }
}

// Process projects in parallel batches to avoid rate limits while being fast
async function processBatch<T, R>(items: T[], batchSize: number, processor: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

export async function POST() {
  const list = await db.select().from(projects);
  const now = new Date();

  // Process GitHub and Vercel in parallel, with batching within each
  const BATCH_SIZE = 5; // Process 5 projects concurrently to avoid rate limits

  const [githubCounts, vercelCounts] = await Promise.all([
    processBatch(list, BATCH_SIZE, processGitHubCommits),
    processBatch(list, BATCH_SIZE, processVercelDeployments)
  ]);

  const updated = [...githubCounts, ...vercelCounts].reduce((a, b) => a + b, 0);

  return NextResponse.json({ ok: true, updated, runAt: now.toISOString() });
}
