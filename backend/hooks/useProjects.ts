import { useEffect, useState } from 'react';
import { ProjectData, ProjectStatus } from '@/types';
import { fetchProjects, updateProjectStatus } from '@/services/projectService';

interface UseProjectsResult {
  projects: ProjectData[];
  loading: boolean;
  error: string | null;
  setProjects: React.Dispatch<React.SetStateAction<ProjectData[]>>;
  toggleStatus: (id: string) => Promise<void>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchProjects()
      .then((data) => {
        if (!mounted) return;
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError('Failed to load projects');
        setProjects([]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleStatus = async (id: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'active' ? 'redundant' : 'active' } : p
      )
    );
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const nextStatus: ProjectStatus = project.status === 'active' ? 'redundant' : 'active';
    try {
      await updateProjectStatus(id, nextStatus);
    } catch (err) {
      console.error('Failed to update status; reverting.', err);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: project.status } : p))
      );
    }
  };

  return { projects, loading, error, setProjects, toggleStatus };
}
