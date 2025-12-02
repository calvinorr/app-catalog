import React from 'react';
import { ProjectData } from '@/types';
import { ExternalLink, Github, Calendar, Sparkles } from 'lucide-react';

interface PortfolioViewProps {
  projects: ProjectData[];
  onProjectClick: (project: ProjectData) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ projects, onProjectClick }) => {
  // Get pinned projects for showcase
  const showcaseProjects = projects.filter(p => p.isPinned);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get live URL from vercelUrl or htmlUrl
  const getLiveUrl = (project: ProjectData) => {
    if (project.vercelUrl) {
      return project.vercelUrl.startsWith('http')
        ? project.vercelUrl
        : `https://${project.vercelUrl}`;
    }
    return null;
  };

  const getGithubUrl = (project: ProjectData) => {
    const htmlUrl = (project as any).htmlUrl;
    const repoSlug = (project as any).repoSlug;

    return htmlUrl ||
      (repoSlug ? `https://github.com/${repoSlug}` : null) ||
      (project.repoUrl?.startsWith('http') ? project.repoUrl :
        project.repoUrl ? `https://${project.repoUrl}` : null);
  };

  const getFrameworkBadgeStyle = (framework: string) => {
    const lowerFramework = framework.toLowerCase();
    if (lowerFramework.includes('next')) {
      return 'bg-slate-900 text-white border-slate-700';
    }
    if (lowerFramework.includes('react')) {
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
    if (lowerFramework.includes('vue')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (lowerFramework.includes('vite')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
    return 'bg-slate-700 text-slate-300 border-slate-600';
  };

  const getStageBadge = (stage?: string | null) => {
    if (!stage) return null;

    const styles = {
      final: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      beta: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      alpha: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      indev: 'bg-slate-700 text-slate-400 border-slate-600'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold uppercase tracking-wider border rounded ${styles[stage as keyof typeof styles] || styles.indev}`}>
        {stage}
      </span>
    );
  };

  if (showcaseProjects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">My App Portfolio</h1>
          <p className="text-slate-400">Showcasing my best development projects</p>
        </div>

        <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl mt-8">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No showcase projects yet.</p>
          <p className="text-sm text-slate-500 mt-1">Pin your best projects from the Dashboard to feature them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Portfolio</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-100 mb-2">My App Portfolio</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          A curated collection of my development projects, showcasing expertise in modern web technologies and full-stack development.
        </p>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {showcaseProjects.map(project => {
          const liveUrl = getLiveUrl(project);
          const githubUrl = getGithubUrl(project);
          const lastDeployDate = project.lastDeployment?.date || project.lastDeploymentAt;

          return (
            <div
              key={project.id}
              className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-slate-700 hover:border-slate-600 flex flex-col"
              onClick={() => onProjectClick(project)}
            >
              {/* Header with Name and Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-100 mb-1 group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getStageBadge(project.stage)}
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${getFrameworkBadgeStyle(project.framework)}`}>
                      {project.framework}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-300 mb-4 leading-relaxed flex-grow">
                {project.description}
              </p>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.slice(0, 5).map(tech => (
                  <span key={tech} className="px-2.5 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md border border-slate-600">
                    {tech}
                  </span>
                ))}
                {project.techStack.length > 5 && (
                  <span className="px-2.5 py-1 bg-slate-900 text-slate-500 text-xs rounded-md border border-slate-700">
                    +{project.techStack.length - 5} more
                  </span>
                )}
              </div>

              {/* Database Badge */}
              {project.database && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-md border border-indigo-500/30">
                    Database: {project.database}
                  </span>
                </div>
              )}

              {/* Footer with Date and Links */}
              <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
                {/* Last Deploy Date */}
                {lastDeployDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(lastDeployDate.toString())}</span>
                  </div>
                )}

                {/* Action Links */}
                <div className="flex items-center gap-2 ml-auto">
                  {githubUrl && (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm rounded-md transition-colors border border-slate-600"
                      title="View on GitHub"
                    >
                      <Github className="w-4 h-4" />
                      <span>Code</span>
                    </a>
                  )}
                  {liveUrl && (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md transition-colors shadow-sm"
                      title="View live site"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Live Demo</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-slate-500 pt-8">
        <p>Showcasing {showcaseProjects.length} featured {showcaseProjects.length === 1 ? 'project' : 'projects'}</p>
      </div>
    </div>
  );
};
