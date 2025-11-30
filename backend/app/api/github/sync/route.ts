import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
}

async function fetchAllRepos(token: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos: GitHubRepo[] = await response.json();

    if (repos.length === 0) {
      break;
    }

    allRepos.push(...repos);

    if (repos.length < perPage) {
      break;
    }

    page++;
  }

  return allRepos;
}

export async function POST() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    const repos = await fetchAllRepos(token);
    const now = new Date();
    let insertedCount = 0;
    let updatedCount = 0;

    for (const repo of repos) {
      // Use full_name as path for GitHub repos (e.g., "username/repo-name")
      const path = `github:${repo.full_name}`;
      const id = crypto.randomUUID();

      // Check if project already exists
      const existing = await db
        .select()
        .from(projects)
        .where(eq(projects.path, path))
        .limit(1);

      const isUpdate = existing.length > 0;

      // Parse pushed_at as lastCommitAt timestamp
      const lastCommitAt = repo.pushed_at ? new Date(repo.pushed_at) : null;

      await db
        .insert(projects)
        .values({
          id,
          name: repo.name,
          path,
          repoSlug: repo.full_name,
          vercelProject: null,
          status: repo.archived ? 'redundant' : 'active',
          source: 'github',
          description: repo.description,
          language: repo.language,
          htmlUrl: repo.html_url,
          lastCommitAt,
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: projects.path,
          set: {
            name: repo.name,
            repoSlug: repo.full_name,
            status: repo.archived ? 'redundant' : 'active',
            description: repo.description,
            language: repo.language,
            htmlUrl: repo.html_url,
            lastCommitAt,
            updatedAt: now
          }
        });

      if (isUpdate) {
        updatedCount++;
      } else {
        insertedCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: repos.length,
      inserted: insertedCount,
      updated: updatedCount
    });
  } catch (error) {
    console.error('Error syncing GitHub repos:', error);
    return NextResponse.json(
      { error: 'Failed to sync GitHub repositories' },
      { status: 500 }
    );
  }
}
