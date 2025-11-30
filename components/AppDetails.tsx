
import React from 'react';
import { X, ExternalLink, Github, Terminal, Database, Server, Clock, GitCommit, CheckCircle, XCircle, AlertCircle, TrendingUp, Layers } from 'lucide-react';
import { ProjectData, DeploymentStatus } from '../types';
import { ActivityHeatmap } from './ActivityHeatmap';

interface ProjectDetailsProps {
  app: ProjectData;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
}

const StatusIcon = ({ status }: { status: DeploymentStatus }) => {
  switch (status) {
    case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
    case 'building': return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    default: return <AlertCircle className="w-5 h-5 text-slate-400" />;
  }
};

export const AppDetails: React.FC<ProjectDetailsProps> = ({ app: project, onClose, onToggleStatus }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-6xl bg-slate-50 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                {project.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                project.status === 'active' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-slate-500 max-w-2xl">{project.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleStatus(project.id)}
              className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              {project.status === 'active' ? 'Mark Redundant' : 'Mark Active'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Main Panel */}
          <div className="flex-1 overflow-y-auto p-8">
            
            {/* Visualizations Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* GitHub Activity */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Github className="w-4 h-4" /> Commit Activity
                  </h3>
                  <span className="text-xs font-mono text-emerald-600 font-medium">Last 90 Days</span>
                </div>
                <div className="flex justify-center">
                   <ActivityHeatmap data={project.commitActivity} type="commits" weeks={20} />
                </div>
              </div>

              {/* Deployment Stability */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Deployment Stability
                  </h3>
                   <span className="text-xs font-mono text-blue-600 font-medium">Health Check</span>
                </div>
                <div className="flex justify-center">
                   <ActivityHeatmap data={project.deploymentActivity} type="deployments" weeks={20} />
                </div>
              </div>
            </div>

            {/* Deployment Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Deployments
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[project.lastDeployment, ...project.recentDeployments].map((dep, idx) => (
                  <div key={dep.id + idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                    <StatusIcon status={dep.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-mono text-sm font-medium text-slate-900 truncate">
                          {dep.commitMessage}
                        </p>
                        <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                          {new Date(dep.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <GitCommit className="w-3 h-3" />
                          <span className="font-mono">{dep.id.split('-')[1]}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-slate-600 bg-slate-100 px-1.5 rounded">{dep.branch}</span>
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
          <div className="w-full lg:w-80 bg-slate-50/50 border-l border-slate-200 p-8 overflow-y-auto">
            
            <div className="space-y-8">
              {/* Links */}
              <div className="space-y-3">
                <a href={`https://${project.repoUrl}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-sm">
                  <Github className="w-4 h-4" /> View Repository
                </a>
                {project.vercelUrl && (
                  <a href={`https://${project.vercelUrl}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm">
                    <ExternalLink className="w-4 h-4" /> View Deployment
                  </a>
                )}
              </div>

              {/* CI/CD Actions Mini-List */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> CI Pipelines
                </h3>
                <div className="space-y-3">
                  {project.actions.map((action, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{action.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{action.lastRun}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        action.status === 'passing' ? 'bg-green-500' : 
                        action.status === 'running' ? 'bg-blue-500 animate-pulse' : 
                        'bg-red-500'}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Infrastructure Details */}
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Infrastructure
                 </h4>
                 
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                   <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                         <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium uppercase">Framework</div>
                        <div className="text-sm font-semibold text-slate-900">{project.framework}</div>
                      </div>
                   </div>

                   {project.database && (
                     <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                           <Database className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium uppercase">Database</div>
                          <div className="text-sm font-semibold text-slate-900">{project.database}</div>
                        </div>
                     </div>
                   )}
                 </div>
              </div>

              {/* Tech Stack */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map(tech => (
                    <span key={tech} className="px-2.5 py-1 bg-white text-slate-700 rounded-md border border-slate-200 text-xs font-medium shadow-sm">
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
