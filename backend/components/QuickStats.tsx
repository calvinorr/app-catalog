import React from 'react';
import { Clock, Rocket, GitCommit } from 'lucide-react';
import { ProjectData } from '@/types';

interface QuickStatsProps {
  projects: ProjectData[];
  onProjectClick: (project: ProjectData) => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ projects, onProjectClick }) => {
  // Get last 3 projects by most recent activity (deployment or commit)
  const recentProjects = React.useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const aTime = new Date(a.lastDeployment.date).getTime();
        const bTime = new Date(b.lastDeployment.date).getTime();
        return bTime - aTime;
      })
      .slice(0, 3);
  }, [projects]);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const getActivityType = (project: ProjectData): 'deploy' | 'commit' => {
    // For now, we'll use the deployment status to determine type
    // In a real app, you'd compare lastDeploymentAt vs lastCommitAt
    return project.lastDeployment.status === 'success' ? 'deploy' : 'commit';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
      </div>

      <div className="space-y-3">
        {recentProjects.map((project) => {
          const activityType = getActivityType(project);

          return (
            <button
              key={project.id}
              onClick={() => onProjectClick(project)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  activityType === 'deploy'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {activityType === 'deploy' ? (
                    <Rocket className="w-4 h-4" />
                  ) : (
                    <GitCommit className="w-4 h-4" />
                  )}
                </div>

                <div className="text-left min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activityType === 'deploy' ? 'Deployed' : 'Committed'} {timeAgo(project.lastDeployment.date)}
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0 text-xs font-medium text-slate-400 group-hover:text-indigo-600 transition-colors">
                View
              </div>
            </button>
          );
        })}
      </div>

      {recentProjects.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-4">
          No recent activity
        </p>
      )}
    </div>
  );
};
