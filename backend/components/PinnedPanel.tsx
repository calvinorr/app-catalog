import React from 'react';
import { Pin, X } from 'lucide-react';
import { ProjectData } from '@/types';

interface PinnedPanelProps {
  projects: ProjectData[];
  onTogglePin: (projectId: string) => void;
  onProjectClick: (project: ProjectData) => void;
}

export const PinnedPanel: React.FC<PinnedPanelProps> = ({
  projects,
  onTogglePin,
  onProjectClick
}) => {
  const pinnedProjects = projects.filter(p => p.isPinned);

  return (
    <div className="hidden lg:block w-64 bg-slate-900 border-l border-slate-700 fixed right-0 top-16 bottom-0 overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Pinned Projects</h3>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {pinnedProjects.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Pin className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Pin projects for quick access</p>
          </div>
        ) : (
          pinnedProjects.map(project => (
            <div
              key={project.id}
              className="bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4
                  onClick={() => onProjectClick(project)}
                  className="font-semibold text-sm text-slate-100 cursor-pointer hover:text-indigo-400 transition-colors flex-1 line-clamp-1"
                >
                  {project.name}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(project.id);
                  }}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  title="Unpin project"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] rounded border border-indigo-500/30 font-medium">
                  {project.framework}
                </span>
                {project.database && (
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded border border-purple-500/30 font-medium">
                    {project.database}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${
                  project.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-700 text-slate-400 border-slate-600'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
