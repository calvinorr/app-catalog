import { useEffect, useState } from 'react';
import { ActivityItem, ProjectData } from '../types';
import { fetchActivity } from '../services/projectService';

interface UseActivityResult {
  activity: ActivityItem[];
  loading: boolean;
}

export function useActivity(projects: ProjectData[]): UseActivityResult {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchActivity()
      .then((data) => {
        if (!mounted) return;
        if (data.length === 0) {
          // Fallback: derive from last/recent deployments in mock/local state
          const derived = projects.flatMap((p) =>
            [p.lastDeployment, ...p.recentDeployments].map((d) => ({
              id: d.id,
              projectId: p.id,
              projectName: p.name,
              type: 'deployment' as const,
              timestamp: d.date,
              title: d.commitMessage,
              url: null
            }))
          );
          setActivity(
            derived.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20)
          );
        } else {
          setActivity(
            data
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 50)
          );
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [projects]);

  return { activity, loading };
}
