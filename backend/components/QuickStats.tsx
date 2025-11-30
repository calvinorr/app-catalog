import React from 'react';
import { Clock, Rocket, GitCommit } from 'lucide-react';
import { ProjectData } from '@/types';

interface QuickStatsProps {
  projects: ProjectData[];
  onProjectClick: (project: ProjectData) => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ projects, onProjectClick }) => {
  // Get last 3 projects by most recent REAL activity (lastCommitAt or lastDeploymentAt)
  const recentProjects = React.useMemo(() => {
    return [...projects]
      .filter(p => p.lastCommitAt || p.lastDeploymentAt) // Only projects with real activity
      .sort((a, b) => {
        const aTime = Math.max(
          a.lastCommitAt ? new Date(a.lastCommitAt).getTime() : 0,
          a.lastDeploymentAt ? new Date(a.lastDeploymentAt).getTime() : 0
        );
        const bTime = Math.max(
          b.lastCommitAt ? new Date(b.lastCommitAt).getTime() : 0,
          b.lastDeploymentAt ? new Date(b.lastDeploymentAt).getTime() : 0
        );
        return bTime - aTime;
      })
      .slice(0, 3);
  }, [projects]);

  const timeAgo = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 0) return 'Unknown';
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  };

  const getActivityType = (project: ProjectData): 'deploy' | 'commit' => {
    // Compare real timestamps to determine which was more recent
    const commitTime = project.lastCommitAt ? new Date(project.lastCommitAt).getTime() : 0;
    const deployTime = project.lastDeploymentAt ? new Date(project.lastDeploymentAt).getTime() : 0;
    return deployTime > commitTime ? 'deploy' : 'commit';
  };

  const getLastActivityDate = (project: ProjectData): Date | null => {
    const commitTime = project.lastCommitAt ? new Date(project.lastCommitAt).getTime() : 0;
    const deployTime = project.lastDeploymentAt ? new Date(project.lastDeploymentAt).getTime() : 0;
    if (commitTime === 0 && deployTime === 0) return null;
    return new Date(Math.max(commitTime, deployTime));
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-slate-100">Recent Activity</h2>
      </div>

      <div className="space-y-3">
        {recentProjects.map((project) => {
          const activityType = getActivityType(project);

          return (
            <button
              key={project.id}
              onClick={() => onProjectClick(project)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-700 transition-colors group border border-transparent hover:border-slate-600"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  activityType === 'deploy'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {activityType === 'deploy' ? (
                    <Rocket className="w-4 h-4" />
                  ) : (
                    <GitCommit className="w-4 h-4" />
                  )}
                </div>

                <div className="text-left min-w-0">
                  <p className="font-semibold text-slate-100 text-sm truncate group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {activityType === 'deploy' ? 'Deployed' : 'Committed'} {timeAgo(getLastActivityDate(project))}
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0 text-xs font-medium text-slate-500 group-hover:text-indigo-400 transition-colors">
                View
              </div>
            </button>
          );
        })}
      </div>

      {recentProjects.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-4">
          No recent activity
        </p>
      )}
    </div>
  );
};
