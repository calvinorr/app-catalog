
import React from 'react';
import { X, ExternalLink, Github, Terminal, Database, Server, Clock, GitCommit, CheckCircle, XCircle, AlertCircle, TrendingUp, Layers, ChevronDown } from 'lucide-react';
import { ProjectData, DeploymentStatus, ProjectStage } from '@/types';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';

interface ProjectDetailsProps {
  app: ProjectData;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onStageChange?: (id: string, stage: ProjectStage) => void;
}

const StatusIcon = ({ status }: { status: DeploymentStatus }) => {
  switch (status) {
    case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
    case 'building': return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    default: return <AlertCircle className="w-5 h-5 text-slate-400" />;
  }
};

const STAGE_OPTIONS: { value: ProjectStage; label: string; color: string }[] = [
  { value: 'final', label: 'Final', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'beta', label: 'Beta', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'alpha', label: 'Alpha', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'indev', label: 'In Dev', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
];

export const AppDetails: React.FC<ProjectDetailsProps> = ({ app: project, onClose, onToggleStatus, onStageChange }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-6xl bg-slate-900 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-8 py-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-100">{project.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs font-medium border border-slate-600">
                {project.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                project.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-700 text-slate-400 border-slate-600'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-slate-400 max-w-2xl">{project.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stage Selector */}
            <div className="relative">
              <select
                value={project.stage || 'indev'}
                onChange={(e) => onStageChange?.(project.id, e.target.value as ProjectStage)}
                className={`appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer transition-colors bg-slate-800 ${
                  project.stage === 'final' ? 'text-emerald-400 border-emerald-500/50' :
                  project.stage === 'beta' ? 'text-amber-400 border-amber-500/50' :
                  project.stage === 'alpha' ? 'text-purple-400 border-purple-500/50' :
                  'text-slate-300 border-slate-600'
                }`}
              >
                {STAGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800 text-slate-200">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-slate-400" />
            </div>
            <button
              onClick={() => onToggleStatus(project.id)}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {project.status === 'active' ? 'Mark Redundant' : 'Mark Active'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

          {/* Main Panel */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-950">
            
            {/* Visualizations Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* GitHub Activity */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Github className="w-4 h-4" /> Commit Activity
                  </h3>
                  <span className="text-xs font-mono text-emerald-400 font-medium">Last 90 Days</span>
                </div>
                <div className="flex justify-center">
                   <ActivityHeatmap data={project.commitActivity} type="commits" weeks={20} />
                </div>
              </div>

              {/* Deployment Stability */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Deployment Stability
                  </h3>
                   <span className="text-xs font-mono text-blue-400 font-medium">Health Check</span>
                </div>
                <div className="flex justify-center">
                   <ActivityHeatmap data={project.deploymentActivity} type="deployments" weeks={20} />
                </div>
              </div>
            </div>

            {/* Deployment Timeline */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50">
                 <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Deployments
                </h3>
              </div>
              <div className="divide-y divide-slate-700">
                {[project.lastDeployment, ...project.recentDeployments].map((dep, idx) => (
                  <div key={dep.id + idx} className="p-4 hover:bg-slate-700/50 transition-colors flex items-center gap-4">
                    <StatusIcon status={dep.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-mono text-sm font-medium text-slate-100 truncate">
                          {dep.commitMessage}
                        </p>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                          {new Date(dep.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <GitCommit className="w-3 h-3" />
                          <span className="font-mono">{dep.id.split('-')[1]}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-slate-300 bg-slate-700 px-1.5 rounded">{dep.branch}</span>
                        </div>
                         <div className="flex items-center gap-1">
                          <span>{dep.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Details & Links */}
          <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-700 p-8 overflow-y-auto">
            
            <div className="space-y-8">
              {/* Links */}
              <div className="space-y-3">
                {(() => {
                  const githubUrl = project.htmlUrl ||
                    (project.repoSlug ? `https://github.com/${project.repoSlug}` : null) ||
                    (project.repoUrl?.startsWith('http') ? project.repoUrl :
                      project.repoUrl ? `https://${project.repoUrl}` : null);
                  return githubUrl ? (
                    <a href={githubUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
                      <Github className="w-4 h-4" /> View Repository
                    </a>
                  ) : null;
                })()}
                {project.vercelUrl && (
                  <a href={project.vercelUrl.startsWith('http') ? project.vercelUrl : `https://${project.vercelUrl}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-sm">
                    <ExternalLink className="w-4 h-4" /> View Deployment
                  </a>
                )}
              </div>

              {/* CI/CD Actions Mini-List */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> CI Pipelines
                </h3>
                <div className="space-y-3">
                  {project.actions.map((action, idx) => (
                    <div key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-100 text-sm">{action.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{action.lastRun}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        action.status === 'passing' ? 'bg-green-400' :
                        action.status === 'running' ? 'bg-blue-400 animate-pulse' :
                        'bg-red-400'}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Infrastructure Details */}
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Infrastructure
                 </h4>

                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm space-y-4">
                   <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-slate-400">
                         <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium uppercase">Framework</div>
                        <div className="text-sm font-semibold text-slate-100">{project.framework}</div>
                      </div>
                   </div>

                   {project.database && (
                     <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-slate-400">
                           <Database className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-medium uppercase">Database</div>
                          <div className="text-sm font-semibold text-slate-100">{project.database}</div>
                        </div>
                     </div>
                   )}
                 </div>
              </div>

              {/* Tech Stack */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map(tech => (
                    <span key={tech} className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded-md border border-slate-700 text-xs font-medium shadow-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
