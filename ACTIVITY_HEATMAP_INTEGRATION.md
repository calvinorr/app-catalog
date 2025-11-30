# ActivityHeatmap Integration with Real Commit Data

## Overview

The ActivityHeatmap component has been wired to use real commit and deployment data from the `/api/activity` endpoint instead of mock data. This provides live visualization of GitHub commits and Vercel deployments across all projects.

## Architecture

### Data Flow

1. **API Endpoint**: `GET /api/activity` returns `ActivityItem[]` from the database
2. **Activity Fetching**: `useActivity` hook fetches and manages activity data
3. **Data Aggregation**: `aggregateActivityByDate()` utility converts activity items into heatmap-ready `ActivityPoint[]`
4. **Visualization**: `ActivityHeatmap` component renders the GitHub-style contribution graph

### New Files Created

#### `/utils/activityUtils.ts`
Utility functions for aggregating activity data:
- `aggregateActivityByDate()` - Converts ActivityItem[] to ActivityPoint[] grouped by date
- `calculateActivityLevel()` - Determines intensity level (0-4) based on activity count
- `getProjectActivitySummary()` - Gets per-project commit/deployment activity

#### `/hooks/useAggregatedActivity.ts`
React hook that provides:
- `globalCommits` - All commit activity across all projects
- `globalDeployments` - All deployment activity across all projects
- `getProjectCommits(projectId)` - Per-project commit activity
- `getProjectDeployments(projectId)` - Per-project deployment activity

#### `/tests/activityAggregation.test.ts`
Comprehensive test suite covering:
- Date-based aggregation
- Activity type filtering (commits vs deployments)
- Failed deployment detection
- Activity level calculations
- Empty data handling

### Modified Components

#### `ActivityHeatmap.tsx`
- Updated to handle the last N days of data correctly
- Changed from slicing first N days to slicing last N days
- Now shows most recent year by default (52 weeks)

#### `AnalysisView.tsx`
- Removed mock activity aggregation logic
- Now uses `useActivity` and `useAggregatedActivity` hooks
- Displays real global commit activity from all projects
- Shows full year (52 weeks) instead of 24 weeks

#### `AppDetails.tsx`
- Added real-time activity fetching for individual projects
- Falls back to mock data if no real activity is available
- Displays both commit and deployment heatmaps with real data
- Extended view from 20 weeks to 52 weeks (full year)

## Usage

### Global Activity (AnalysisView)

```tsx
import { useActivity } from '@/hooks/useActivity';
import { useAggregatedActivity } from '@/hooks/useAggregatedActivity';

const { activity } = useActivity(projects);
const { globalCommits } = useAggregatedActivity(activity, 365);

<ActivityHeatmap data={globalCommits} weeks={52} type="commits" />
```

### Per-Project Activity (AppDetails)

```tsx
import { useActivity } from '@/hooks/useActivity';
import { useAggregatedActivity } from '@/hooks/useAggregatedActivity';

const { activity } = useActivity([project]);
const { getProjectCommits, getProjectDeployments } = useAggregatedActivity(activity, 365);

const projectCommits = getProjectCommits(project.id);
const projectDeployments = getProjectDeployments(project.id);

<ActivityHeatmap data={projectCommits} type="commits" weeks={52} />
<ActivityHeatmap data={projectDeployments} type="deployments" weeks={52} />
```

## Activity Levels

Commit activity levels (based on commits per day):
- Level 0: 0 commits (gray)
- Level 1: 1 commit (light green)
- Level 2: 2-3 commits (medium green)
- Level 3: 4-6 commits (dark green)
- Level 4: 7+ commits (darkest green)

Deployment activity levels (based on deployments per day):
- Level 0: 0 deployments (gray)
- Level 1: 1 deployment (light blue)
- Level 2: 2 deployments (medium blue)
- Level 3: 3-4 deployments (dark blue)
- Level 4: 5+ deployments (darkest blue)
- Failed deployments: Red (overrides level)

## Backend Requirements

The `/api/activity` endpoint must return activity items in this format:

```typescript
interface ActivityItem {
  id: string;
  projectId: string;
  projectName?: string;
  type: 'commit' | 'deployment';
  timestamp: string; // ISO 8601 format
  title: string;
  url?: string | null;
  metadata?: {
    status?: 'success' | 'failed';
    [key: string]: unknown;
  };
}
```

Activity items are stored in the `activity_items` table in Turso/SQLite and populated by:
- GitHub commit webhook/sync (`/api/github/sync`)
- Vercel deployment webhook/sync (`/api/vercel/sync`)
- Manual refresh (`/api/refresh-activity`)

## Fallback Behavior

- If the API is unavailable, `useActivity` falls back to deriving activity from project deployment data
- If a project has no real activity data, `AppDetails` falls back to mock `commitActivity` and `deploymentActivity` from the project object
- The `AnalysisView` gracefully handles empty activity arrays

## Testing

Run the test suite:

```bash
npx vitest run tests/activityAggregation.test.ts
```

Tests cover:
- Date aggregation accuracy
- Activity type filtering
- Failed deployment detection
- Activity level calculation
- Edge cases (empty data, boundary conditions)

## Future Enhancements

Potential improvements:
- Add date range picker to view different time periods
- Show detailed tooltips with commit messages
- Add project filters in global view
- Export activity data as CSV/JSON
- Add weekly/monthly summary statistics
- Implement click-through to GitHub commits
