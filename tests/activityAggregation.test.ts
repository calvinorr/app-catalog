import { describe, it, expect } from 'vitest';
import { aggregateActivityByDate } from '../utils/activityUtils';
import { ActivityItem } from '../types';

// Helper to get ISO date string for a date relative to today
function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Helper to get ISO timestamp for a date relative to today
function getTimestamp(daysAgo: number, hour: number = 10): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

describe('Activity Aggregation', () => {
  it('should aggregate commit activity by date', () => {
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        projectId: 'proj1',
        type: 'commit',
        timestamp: getTimestamp(0, 10), // today at 10am
        title: 'Initial commit'
      },
      {
        id: '2',
        projectId: 'proj1',
        type: 'commit',
        timestamp: getTimestamp(0, 14), // today at 2pm
        title: 'Add feature'
      },
      {
        id: '3',
        projectId: 'proj1',
        type: 'commit',
        timestamp: getTimestamp(1, 10), // yesterday at 10am
        title: 'Fix bug'
      }
    ];

    const result = aggregateActivityByDate(mockActivity, 'commit', 7);

    expect(result).toHaveLength(7);

    // Find today's entry
    const today = result.find(r => r.date === getDateString(0));
    expect(today?.count).toBe(2);
    expect(today?.level).toBeGreaterThan(0);

    // Find yesterday's entry
    const yesterday = result.find(r => r.date === getDateString(1));
    expect(yesterday?.count).toBe(1);
    expect(yesterday?.level).toBe(1);
  });

  it('should filter deployment activity separately', () => {
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        projectId: 'proj1',
        type: 'commit',
        timestamp: getTimestamp(0, 10),
        title: 'Commit'
      },
      {
        id: '2',
        projectId: 'proj1',
        type: 'deployment',
        timestamp: getTimestamp(0, 14),
        title: 'Deploy',
        metadata: { status: 'success' }
      }
    ];

    const commits = aggregateActivityByDate(mockActivity, 'commit', 7);
    const deployments = aggregateActivityByDate(mockActivity, 'deployment', 7);

    const todayCommits = commits.find(r => r.date === getDateString(0));
    const todayDeployments = deployments.find(r => r.date === getDateString(0));

    expect(todayCommits?.count).toBe(1);
    expect(todayDeployments?.count).toBe(1);
  });

  it('should mark failed deployments correctly', () => {
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        projectId: 'proj1',
        type: 'deployment',
        timestamp: getTimestamp(0, 10),
        title: 'Deploy',
        metadata: { status: 'failed' }
      }
    ];

    const result = aggregateActivityByDate(mockActivity, 'deployment', 7);
    const today = result.find(r => r.date === getDateString(0));

    expect(today?.status).toBe('failed');
  });

  it('should calculate activity levels correctly', () => {
    const createActivity = (count: number): ActivityItem[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `${i}`,
        projectId: 'proj1',
        type: 'commit' as const,
        timestamp: getTimestamp(0, 10),
        title: `Commit ${i}`
      }));
    };

    const result1 = aggregateActivityByDate(createActivity(1), 'commit', 7);
    expect(result1.find(r => r.date === getDateString(0))?.level).toBe(1);

    const result3 = aggregateActivityByDate(createActivity(3), 'commit', 7);
    expect(result3.find(r => r.date === getDateString(0))?.level).toBe(2);

    const result6 = aggregateActivityByDate(createActivity(6), 'commit', 7);
    expect(result6.find(r => r.date === getDateString(0))?.level).toBe(3);

    const result10 = aggregateActivityByDate(createActivity(10), 'commit', 7);
    expect(result10.find(r => r.date === getDateString(0))?.level).toBe(4);
  });

  it('should handle empty activity', () => {
    const result = aggregateActivityByDate([], 'commit', 7);

    expect(result).toHaveLength(7);
    expect(result.every(r => r.count === 0)).toBe(true);
    expect(result.every(r => r.level === 0)).toBe(true);
  });
});
