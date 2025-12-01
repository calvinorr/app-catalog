
import React, { useMemo } from 'react';
import { ProjectData } from '@/types';
import { Clock, GitCommit, Rocket, Github, Triangle, ExternalLink } from 'lucide-react';

interface WeeklyFocusProps {
  projects: ProjectData[];
  onProjectClick?: (project: ProjectData) => void;
}

// Relative time formatter
const timeAgo = (date: Date | string | null | undefined): string => {
  if (!date) return 'No activity';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 0) return 'No activity';
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
};

export const WeeklyFocus: React.FC<WeeklyFocusProps> = ({ projects, onProjectClick }) => {
  // Get latest 6 projects sorted by most recent activity
  const latestProjects = useMemo(() => {
    return [...projects]
      .filter(p => p.lastCommitAt || p.lastDeploymentAt)
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
      .slice(0, 6);
  }, [projects]);

  if (latestProjects.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide">LATEST ACTIVITY</h2>
            <p className="text-[10px] text-slate-500 font-mono">Most recently updated projects</p>
          </div>
        </div>
      </div>

      {/* 6-card grid - 3 columns on large screens, 2 on medium */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {latestProjects.map((project) => {
          const lastActivity = project.lastCommitAt
            ? new Date(project.lastCommitAt)
            : project.lastDeploymentAt
              ? new Date(project.lastDeploymentAt)
              : null;

          const isDeployment = project.lastDeploymentAt &&
            (!project.lastCommitAt || new Date(project.lastDeploymentAt) > new Date(project.lastCommitAt));

          const recentCommits = project.commitActivity?.slice(-7) || [];
          const totalCommits = recentCommits.reduce((sum, d) => sum + d.count, 0);

          // Source indicator
          const hasVercel = !!project.vercelProject;
          const hasGithub = !!project.repoSlug;

          return (
            <button
              key={project.id}
              onClick={() => onProjectClick?.(project)}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg p-3 text-left transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
            >
              {/* Top row: Name + Source icons */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-100 text-sm truncate group-hover:text-white transition-colors flex-1">
                  {project.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasGithub && (
                    <Github className="w-3 h-3 text-slate-500" />
                  )}
                  {hasVercel && (
                    <Triangle className="w-3 h-3 text-slate-500 fill-slate-500" />
                  )}
                </div>
              </div>

              {/* Middle: Activity bar + stats */}
              <div className="flex items-end gap-0.5 h-4 mb-2">
                {recentCommits.length > 0 ? recentCommits.map((day, i) => {
                  const height = day.count === 0 ? 0 : Math.max(20, Math.min(100, day.count * 30));
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-all ${
                        day.count > 0
                          ? 'bg-emerald-500/60 group-hover:bg-emerald-400/70'
                          : 'bg-slate-700/30'
                      }`}
                      style={{ height: height === 0 ? '2px' : `${height}%` }}
                    />
                  );
                }) : (
                  <div className="flex-1 h-[2px] bg-slate-700/30 rounded-sm" />
                )}
              </div>

              {/* Bottom: Timestamp + commit count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {isDeployment ? (
                    <Rocket className="w-3 h-3 text-blue-400" />
                  ) : (
                    <GitCommit className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className="text-[10px] font-mono text-slate-400">
                    {timeAgo(lastActivity)}
                  </span>
                </div>
                {totalCommits > 0 && (
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                    {totalCommits} commit{totalCommits !== 1 ? 's' : ''} / 7d
                  </span>
                )}
              </div>

              {/* Stage badge (if set) */}
              {project.stage && project.stage !== 'indev' && (
                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  project.stage === 'final' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  project.stage === 'beta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  project.stage === 'alpha' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {project.stage}
                </div>
              )}

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-emerald-500/0 to-cyan-500/0 group-hover:from-emerald-500/5 group-hover:to-cyan-500/5 transition-all duration-300 pointer-events-none" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
