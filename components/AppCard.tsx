import React from 'react';
import { GitBranch, Clock, AlertCircle, CheckCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { ProjectData, DeploymentStatus } from '../types';

interface ProjectCardProps {
  project: ProjectData;
  onClick: (project: ProjectData) => void;
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

export const AppCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div 
      onClick={() => onClick(project)}
      className={`
        group bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border flex flex-col h-full relative
        ${project.lastDeployment.status === 'failed' ? 'border-red-200' : 'border-slate-200'}
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            {project.name}
            {project.vercelUrl && <ArrowUpRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{project.category}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
            project.status === 'active' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {project.status}
          </span>
          <StatusBadge status={project.lastDeployment.status} />
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

      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5" />
          <span className="font-mono max-w-[80px] truncate">{project.lastDeployment.branch}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeAgo(project.lastDeployment.date)}</span>
        </div>
      </div>
    </div>
  );
};
