import React from 'react';
import { GitBranch, Clock, AlertCircle, CheckCircle, Loader2, ArrowUpRight, Pin, FolderOpen, Github, Database, ExternalLink } from 'lucide-react';
import { ProjectData, DeploymentStatus } from '../types';

interface ProjectCardProps {
  project: ProjectData;
  onClick: (project: ProjectData) => void;
  onTogglePin?: (projectId: string) => void;
}

const StatusIcon = ({ status }: { status: DeploymentStatus }) => {
  switch (status) {
    case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'building': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'queued': return <Clock className="w-4 h-4 text-slate-400" />;
  }
};

const StatusBadge = ({ status }: { status: DeploymentStatus }) => {
  const styles = {
    success: 'bg-green-50 text-green-700 border-green-100',
    failed: 'bg-red-50 text-red-700 border-red-100',
    building: 'bg-blue-50 text-blue-700 border-blue-100',
    queued: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1.5 ${styles[status]}`}>
      <StatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Deployment status badge for card header
const DeploymentStatusBadge = ({ hasVercel, lastDeploymentFailed }: { hasVercel: boolean, lastDeploymentFailed: boolean }) => {
  if (lastDeploymentFailed && hasVercel) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1.5 bg-red-50 text-red-700 border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        Failed
      </span>
    );
  }

  if (hasVercel) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1.5 bg-green-50 text-green-700 border-green-100">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        Live
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1.5 bg-slate-50 text-slate-500 border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      Local
    </span>
  );
};

export const AppCard: React.FC<ProjectCardProps> = ({ project, onClick, onTogglePin }) => {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  // Extract fields that may not exist yet in all ProjectData instances
  const path = (project as any).path;
  const repoSlug = (project as any).repoSlug;
  const vercelProject = (project as any).vercelProject;
  const htmlUrl = (project as any).htmlUrl;

  const hasVercel = !!vercelProject || !!project.vercelUrl;
  const lastDeploymentFailed = project.lastDeployment?.status === 'failed';

  // Get GitHub URL from htmlUrl or construct from repoSlug or repoUrl
  const githubUrl = htmlUrl ||
    (repoSlug ? `https://github.com/${repoSlug}` : null) ||
    (project.repoUrl?.startsWith('http') ? project.repoUrl :
      project.repoUrl ? `https://${project.repoUrl}` : null);

  // Get Vercel dashboard URL
  const vercelDashboardUrl = vercelProject ? `https://vercel.com/dashboard/project/${vercelProject}` : null;

  // Truncate commit message for preview
  const truncateMessage = (msg: string, maxLength: number = 40) => {
    if (msg.length <= maxLength) return msg;
    return msg.substring(0, maxLength) + '...';
  };

  const handleQuickAction = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => onClick(project)}
      className={`
        group bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border flex flex-col h-full relative
        ${lastDeploymentFailed ? 'border-red-200' : 'border-slate-200'}
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              {project.displayName || project.name}
              {project.vercelUrl && <ArrowUpRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </h3>
          </div>
          {project.repoSlug && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">{project.repoSlug}</p>
          )}
          <p className="text-xs text-slate-500 mt-0.5">{project.category}</p>

          {/* Last commit preview */}
          {project.lastDeployment?.commitMessage && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(project.lastDeployment.date)}: {truncateMessage(project.lastDeployment.commitMessage)}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onTogglePin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(project.id);
              }}
              className={`p-1 rounded transition-colors ${
                project.isPinned
                  ? 'text-indigo-600 hover:text-indigo-700'
                  : 'text-slate-300 hover:text-slate-400'
              }`}
              title={project.isPinned ? 'Unpin project' : 'Pin project'}
            >
              <Pin className={`w-3.5 h-3.5 ${project.isPinned ? 'fill-current' : ''}`} />
            </button>
          )}
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
            project.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {project.status}
          </span>
          <DeploymentStatusBadge hasVercel={hasVercel} lastDeploymentFailed={lastDeploymentFailed} />
        </div>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 mb-4 h-10">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.techStack.slice(0, 3).map(tech => (
          <span key={tech} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
            {tech}
          </span>
        ))}
        {project.techStack.length > 3 && (
          <span className="px-2 py-1 bg-slate-50 text-slate-400 text-xs rounded border border-slate-100">
            +{project.techStack.length - 3}
          </span>
        )}
      </div>

      {/* Quick Actions Row */}
      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2">
        {/* Local folder link */}
        {path && (
          <button
            onClick={(e) => handleQuickAction(e, `file://${path}`)}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors group/btn"
            title={`Open local folder: ${path}`}
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        )}

        {/* GitHub link */}
        {githubUrl && (
          <button
            onClick={(e) => handleQuickAction(e, githubUrl)}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors group/btn"
            title={`Open GitHub: ${githubUrl}`}
          >
            <Github className="w-4 h-4" />
          </button>
        )}

        {/* Vercel dashboard link */}
        {vercelDashboardUrl && (
          <button
            onClick={(e) => handleQuickAction(e, vercelDashboardUrl)}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors group/btn"
            title={`Open Vercel dashboard: ${vercelProject}`}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        {/* Database indicator */}
        {project.database && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded text-slate-400 cursor-help"
            title={`Database: ${project.database}`}
          >
            <Database className="w-4 h-4" />
          </div>
        )}

        {/* Branch info moved to right side */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
          <GitBranch className="w-3.5 h-3.5" />
          <span className="font-mono max-w-[80px] truncate">{project.lastDeployment?.branch || 'main'}</span>
        </div>
      </div>
    </div>
  );
};
