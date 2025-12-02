import { useEffect, useState } from 'react';
import { ProjectData, ProjectStatus, ProjectStage } from '@/types';
import { fetchProjects, updateProjectStatus, updateProjectStage, toggleProjectPin } from '@/services/projectService';

interface UseProjectsResult {
  projects: ProjectData[];
  loading: boolean;
  error: string | null;
  setProjects: React.Dispatch<React.SetStateAction<ProjectData[]>>;
  toggleStatus: (id: string) => Promise<void>;
  updateStage: (id: string, stage: ProjectStage) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
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

  const updateStage = async (id: string, stage: ProjectStage) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const prevStage = project.stage;
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stage } : p))
    );
    try {
      await updateProjectStage(id, stage);
    } catch (err) {
      console.error('Failed to update stage; reverting.', err);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stage: prevStage } : p))
      );
    }
  };

  const togglePin = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const prevPinned = project.isPinned || false;
    // Optimistically update UI
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPinned: !prevPinned } : p))
    );
    try {
      const newIsPinned = await toggleProjectPin(id);
      if (newIsPinned !== null) {
        // Update with server response
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isPinned: newIsPinned } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle pin; reverting.', err);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isPinned: prevPinned } : p))
      );
    }
  };

  return { projects, loading, error, setProjects, toggleStatus, updateStage, togglePin };
}
