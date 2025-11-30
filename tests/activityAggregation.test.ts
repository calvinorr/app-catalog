import { describe, it, expect } from 'vitest';
import { aggregateActivityByDate } from '../utils/activityUtils';
import { ActivityItem } from '../types';

describe('Activity Aggregation', () => {
  it('should aggregate commit activity by date', () => {
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        projectId: 'proj1',
        type: 'commit',
        timestamp: '2025-11-30T10:00:00Z',
        title: 'Initial commit'
      },
      {
        id: '2',
        projectId: 'proj1',
        type: 'commit',
        timestamp: '2025-11-30T14:00:00Z',
        title: 'Add feature'
      },
      {
        id: '3',
        projectId: 'proj1',
        type: 'commit',
        timestamp: '2025-11-29T10:00:00Z',
        title: 'Fix bug'
      }
    ];

    const result = aggregateActivityByDate(mockActivity, 'commit', 7);

    expect(result).toHaveLength(7);

    // Find today's entry
    const today = result.find(r => r.date === '2025-11-30');
    expect(today?.count).toBe(2);
    expect(today?.level).toBeGreaterThan(0);

    // Find yesterday's entry
    const yesterday = result.find(r => r.date === '2025-11-29');
    expect(yesterday?.count).toBe(1);
    expect(yesterday?.level).toBe(1);
  });

  it('should filter deployment activity separately', () => {
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        projectId: 'proj1',
        type: 'commit',
        timestamp: '2025-11-30T10:00:00Z',
        title: 'Commit'
      },
      {
        id: '2',
        projectId: 'proj1',
        type: 'deployment',
        timestamp: '2025-11-30T14:00:00Z',
        title: 'Deploy',
        metadata: { status: 'success' }
      }
    ];

    const commits = aggregateActivityByDate(mockActivity, 'commit', 7);
    const deployments = aggregateActivityByDate(mockActivity, 'deployment', 7);

    const todayCommits = commits.find(r => r.date === '2025-11-30');
    const todayDeployments = deployments.find(r => r.date === '2025-11-30');

    expect(todayCommits?.count).toBe(1);
    expect(todayDeployments?.count).toBe(1);
  });

  it('should mark failed deployments correctly', () => {
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        projectId: 'proj1',
        type: 'deployment',
        timestamp: '2025-11-30T10:00:00Z',
        title: 'Deploy',
        metadata: { status: 'failed' }
      }
    ];

    const result = aggregateActivityByDate(mockActivity, 'deployment', 7);
    const today = result.find(r => r.date === '2025-11-30');

    expect(today?.status).toBe('failed');
  });

  it('should calculate activity levels correctly', () => {
    const createActivity = (count: number): ActivityItem[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `${i}`,
        projectId: 'proj1',
        type: 'commit' as const,
        timestamp: '2025-11-30T10:00:00Z',
        title: `Commit ${i}`
      }));
    };

    const result1 = aggregateActivityByDate(createActivity(1), 'commit', 7);
    expect(result1.find(r => r.date === '2025-11-30')?.level).toBe(1);

    const result3 = aggregateActivityByDate(createActivity(3), 'commit', 7);
    expect(result3.find(r => r.date === '2025-11-30')?.level).toBe(2);

    const result6 = aggregateActivityByDate(createActivity(6), 'commit', 7);
    expect(result6.find(r => r.date === '2025-11-30')?.level).toBe(3);

    const result10 = aggregateActivityByDate(createActivity(10), 'commit', 7);
    expect(result10.find(r => r.date === '2025-11-30')?.level).toBe(4);
  });

  it('should handle empty activity', () => {
    const result = aggregateActivityByDate([], 'commit', 7);

    expect(result).toHaveLength(7);
    expect(result.every(r => r.count === 0)).toBe(true);
    expect(result.every(r => r.level === 0)).toBe(true);
  });
});
