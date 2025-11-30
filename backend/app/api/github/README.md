# GitHub API Endpoints

This directory contains API endpoints for fetching and syncing GitHub repositories.

## Prerequisites

Set the `GITHUB_TOKEN` environment variable in `/Users/calvinorr/Dev/Projects/AppCatalogue/backend/.env`:

```
GITHUB_TOKEN=ghp_your_github_personal_access_token
```

To create a GitHub Personal Access Token:
1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with `repo` scope
3. Copy the token and add it to your `.env` file

## Endpoints

### GET /api/github/repos

Fetches all repositories for the authenticated GitHub user.

**Features:**
- Handles pagination automatically (GitHub returns max 100 repos per page)
- Fetches all pages until no more repos are found
- Filters to show only repos owned by the user (not collaborations)
- Sorted by recently updated

**Response:**
```json
{
  "repos": [
    {
      "id": 123456789,
      "name": "my-project",
      "full_name": "username/my-project",
      "html_url": "https://github.com/username/my-project",
      "description": "Project description",
      "language": "TypeScript",
      "updated_at": "2024-11-30T12:00:00Z",
      "private": false,
      "fork": false,
      "archived": false
    }
  ],
  "count": 42
}
```

**Usage:**
```bash
curl http://localhost:3001/api/github/repos
```

### POST /api/github/sync

Syncs all GitHub repositories into the local Turso database.

**Features:**
- Fetches all repos using the same pagination logic as `/repos`
- Upserts each repo into the `projects` table
- Sets `source='github'` to distinguish from scanned local projects
- Uses `github:{full_name}` as the unique path (e.g., `github:username/my-project`)
- Marks archived repos as `status='redundant'`
- Stores repo metadata: description, language, html_url

**Response:**
```json
{
  "ok": true,
  "total": 42,
  "inserted": 30,
  "updated": 12
}
```

**Usage:**
```bash
curl -X POST http://localhost:3001/api/github/sync
```

## Database Schema

The sync endpoint updates the `projects` table with these fields:

- `source`: Set to 'github' for synced repos (vs 'scanner' for local scans)
- `path`: Format `github:{full_name}` (e.g., `github:calvinorr/AppCatalogue`)
- `name`: Repository name
- `repoSlug`: Full repository name (e.g., `calvinorr/AppCatalogue`)
- `description`: Repository description from GitHub
- `language`: Primary language detected by GitHub
- `htmlUrl`: Direct link to the repository on GitHub
- `status`: 'active' for normal repos, 'redundant' for archived repos

## Example Workflow

1. **Fetch repos to preview:**
   ```bash
   curl http://localhost:3001/api/github/repos | jq '.repos[] | {name, language, updated_at}'
   ```

2. **Sync repos to database:**
   ```bash
   curl -X POST http://localhost:3001/api/github/sync
   ```

3. **View all projects (including GitHub repos):**
   ```bash
   curl http://localhost:3001/api/projects | jq '.projects[] | select(.source=="github")'
   ```

## Error Handling

Both endpoints will return 500 status with error details if:
- `GITHUB_TOKEN` is not configured
- GitHub API is unavailable or rate-limited
- Database connection fails

**Example error response:**
```json
{
  "error": "GITHUB_TOKEN not configured"
}
```

## Rate Limiting

GitHub API has rate limits:
- Authenticated requests: 5,000 requests per hour
- Each page of repos counts as 1 request
- The sync endpoint will use approximately `(total_repos / 100) + 1` requests

For example:
- 50 repos = 1 request
- 150 repos = 2 requests
- 500 repos = 5 requests
