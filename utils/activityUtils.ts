import { ActivityItem, ActivityPoint } from '../types';

/**
 * Aggregates activity items by date into ActivityPoint format for heatmap visualization
 * @param activityItems Raw activity items from the API
 * @param type Filter by activity type (commits/deployments), or 'all' for both
 * @param days Number of days to include (default 365 for one year)
 * @returns Array of ActivityPoint objects with counts and intensity levels
 */
export function aggregateActivityByDate(
  activityItems: ActivityItem[],
  type: 'commit' | 'deployment' | 'all' = 'all',
  days: number = 365
): ActivityPoint[] {
  // Filter by type if specified
  const filtered = type === 'all'
    ? activityItems
    : activityItems.filter(item => item.type === type);

  // Create a map of date -> count
  const dateMap = new Map<string, { count: number; hasFailure: boolean }>();

  // Initialize all dates for the last N days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dateMap.set(dateStr, { count: 0, hasFailure: false });
  }

  // Aggregate activity items by date
  filtered.forEach(item => {
    const date = new Date(item.timestamp);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];

    if (dateMap.has(dateStr)) {
      const current = dateMap.get(dateStr)!;
      current.count++;

      // Check for deployment failures
      if (item.type === 'deployment' && item.metadata?.status === 'failed') {
        current.hasFailure = true;
      }
    }
  });

  // Convert map to ActivityPoint array
  const result: ActivityPoint[] = [];

  dateMap.forEach((value, dateStr) => {
    const level = calculateActivityLevel(value.count, type);
    const status = value.hasFailure ? 'failed' : (value.count > 0 ? 'success' : 'neutral');

    result.push({
      date: dateStr,
      count: value.count,
      level,
      status: status as 'success' | 'failed' | 'neutral'
    });
  });

  // Sort by date (oldest first) to match expected format
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate activity level (0-4) based on count
 * Thresholds differ for commits vs deployments
 */
function calculateActivityLevel(count: number, type: 'commit' | 'deployment' | 'all'): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;

  // Commits typically have higher frequency
  if (type === 'commit' || type === 'all') {
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
  }

  // Deployments are less frequent
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

/**
 * Get activity summary for a specific project
 */
export function getProjectActivitySummary(
  activityItems: ActivityItem[],
  projectId: string,
  days: number = 90
): {
  commitActivity: ActivityPoint[];
  deploymentActivity: ActivityPoint[];
} {
  const projectItems = activityItems.filter(item => item.projectId === projectId);

  return {
    commitActivity: aggregateActivityByDate(projectItems, 'commit', days),
    deploymentActivity: aggregateActivityByDate(projectItems, 'deployment', days)
  };
}
