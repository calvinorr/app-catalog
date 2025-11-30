import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
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

export async function GET() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    const repos = await fetchAllRepos(token);

    return NextResponse.json({
      repos: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        language: repo.language,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        private: repo.private,
        fork: repo.fork,
        archived: repo.archived
      })),
      count: repos.length
    });
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub repositories' },
      { status: 500 }
    );
  }
}
