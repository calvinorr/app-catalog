
import React, { useMemo } from 'react';
import { ProjectData } from '@/types';
import { Zap, GitCommit, ArrowRight, Activity } from 'lucide-react';

interface WeeklyFocusProps {
  projects: ProjectData[];
}

export const WeeklyFocus: React.FC<WeeklyFocusProps> = ({ projects }) => {
  const activeProjects = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return projects.filter(p => {
      const lastDeploy = new Date(p.lastDeployment.date);
      // Check if last deployment was recent OR if there are recent commits (checking last 7 days of activity array)
      const hasRecentActivity = p.commitActivity.slice(-7).some(a => a.count > 0);
      return lastDeploy > oneWeekAgo || hasRecentActivity;
    }).sort((a, b) => new Date(b.lastDeployment.date).getTime() - new Date(a.lastDeployment.date).getTime());
  }, [projects]);

  if (activeProjects.length === 0) return null;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h2 className="text-lg font-bold text-slate-100">Weekly Focus</h2>
        <span className="text-xs text-slate-500 font-mono ml-2 border-l border-slate-700 pl-3">
          Projects active in the last 7 days
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeProjects.slice(0, 3).map(project => {
          // Calculate intensity for the sparkline visual
          const recentCommits = project.commitActivity.slice(-7);
          
          return (
            <div key={project.id} className="bg-slate-900 text-white rounded-xl p-5 shadow-lg relative overflow-hidden group">
              {/* Background accent */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{project.name}</h3>
                  <div className="text-slate-400 text-xs font-mono mt-1">
                    {project.category}
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  project.lastDeployment.status === 'success' ? 'bg-green-500/20 text-green-400' :
                  project.lastDeployment.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {project.lastDeployment.status}
                </div>
              </div>

              {/* Sparkline Visualization */}
              <div className="flex items-end gap-1 h-8 mb-4">
                {recentCommits.map((day, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-indigo-500/40 hover:bg-indigo-400 transition-colors rounded-sm min-h-[4px]"
                    style={{ height: `${Math.max(10, Math.min(100, day.count * 20))}%` }}
                    title={`${day.count} commits`}
                  ></div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <GitCommit className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{project.lastDeployment.commitMessage}</span>
                </div>
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
          );
        })}
        
        {activeProjects.length > 3 && (
            <div className="flex items-center justify-center bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl p-5 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors cursor-pointer group">
                <div className="text-center">
                    <div className="font-bold text-xl group-hover:scale-110 transition-transform">+{activeProjects.length - 3}</div>
                    <div className="text-xs font-medium">more active</div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
