import { useMemo } from 'react';
import { ActivityItem, ActivityPoint } from '../types';
import { aggregateActivityByDate } from '../utils/activityUtils';

interface UseAggregatedActivityResult {
  globalCommits: ActivityPoint[];
  globalDeployments: ActivityPoint[];
  getProjectCommits: (projectId: string) => ActivityPoint[];
  getProjectDeployments: (projectId: string) => ActivityPoint[];
}

/**
 * Hook to aggregate activity items into heatmap-ready format
 * Provides global and per-project activity aggregations
 */
export function useAggregatedActivity(
  activityItems: ActivityItem[],
  days: number = 365
): UseAggregatedActivityResult {
  const globalCommits = useMemo(() => {
    return aggregateActivityByDate(activityItems, 'commit', days);
  }, [activityItems, days]);

  const globalDeployments = useMemo(() => {
    return aggregateActivityByDate(activityItems, 'deployment', days);
  }, [activityItems, days]);

  const getProjectCommits = useMemo(() => {
    return (projectId: string) => {
      const projectItems = activityItems.filter(item => item.projectId === projectId);
      return aggregateActivityByDate(projectItems, 'commit', days);
    };
  }, [activityItems, days]);

  const getProjectDeployments = useMemo(() => {
    return (projectId: string) => {
      const projectItems = activityItems.filter(item => item.projectId === projectId);
      return aggregateActivityByDate(projectItems, 'deployment', days);
    };
  }, [activityItems, days]);

  return {
    globalCommits,
    globalDeployments,
    getProjectCommits,
    getProjectDeployments
  };
}
