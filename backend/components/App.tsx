'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ProjectCategory, ProjectData, ViewOption, SortOption, ProjectStatus, DatabaseFilter, SourceFilter } from '@/types';
import { AppCard } from '@/components/AppCard';
import { AppDetails } from '@/components/AppDetails';
import { Navigation } from '@/components/Navigation';
import { WeeklyFocus } from '@/components/WeeklyFocus';
import { ProjectToolbar } from '@/components/ProjectToolbar';
import { AnalysisView } from '@/components/AnalysisView';
import { QuickStats } from '@/components/QuickStats';
import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { ScrollText, GitCommit, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useActivity } from '@/hooks/useActivity';

export default function App() {
  const { projects, loading, error, toggleStatus } = useProjects();
  const [currentView, setCurrentView] = useState<ViewOption>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>(ProjectCategory.All);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');
  const [databaseFilter, setDatabaseFilter] = useState<DatabaseFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const { activity: globalActivity } = useActivity(projects);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Sidebar filter state
  const [sidebarFilter, setSidebarFilter] = useState<{
    type: 'overview' | 'status' | 'framework' | 'category';
    value: string;
  }>({ type: 'overview', value: 'all' });

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extract unique frameworks for filter dropdown
  const availableFrameworks = useMemo(() => {
    const frameworks = new Set<string>();
    projects.forEach(p => {
      if (p.framework) frameworks.add(p.framework);
    });
    return Array.from(frameworks).sort();
  }, [projects]);

  // Handle sidebar filter changes
  const handleSidebarFilterChange = (
    type: 'overview' | 'status' | 'framework' | 'category',
    value: string
  ) => {
    setSidebarFilter({ type, value });

    // Reset other filters and apply the sidebar filter
    setSelectedCategory(ProjectCategory.All);
    setStatusFilter('all');
    setFrameworkFilter('all');
    setDatabaseFilter('all');

    if (type === 'overview') {
      // Show all projects
    } else if (type === 'status') {
      setStatusFilter(value as ProjectStatus);
    } else if (type === 'framework') {
      setFrameworkFilter(value);
    } else if (type === 'category') {
      const categoryMap: Record<string, ProjectCategory> = {
        'Frontend': ProjectCategory.Frontend,
        'Backend': ProjectCategory.Backend,
        'Fullstack': ProjectCategory.Fullstack,
        'Tooling': ProjectCategory.Tooling,
        'Mobile': ProjectCategory.Mobile,
      };
      setSelectedCategory(categoryMap[value] || ProjectCategory.All);
    }
  };

  // Filter & Sort Logic
  const filteredProjects = useMemo(() => {
    let result = projects;

    // 0. Source Filter (Global - applies first)
    if (sourceFilter === 'github') {
      // Show only projects with GitHub repo but NO Vercel deployment
      result = result.filter(p => p.repoSlug && !p.vercelProject);
    } else if (sourceFilter === 'vercel') {
      // Show only projects WITH Vercel deployment
      result = result.filter(p => p.vercelProject);
    }

    // 1. Category Filter
    if (selectedCategory !== ProjectCategory.All) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 1b. Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    // 1c. Framework Filter
    if (frameworkFilter !== 'all') {
      result = result.filter(p => p.framework === frameworkFilter);
    }

    // 1d. Database Filter
    if (databaseFilter === 'yes') {
      result = result.filter(p => p.database && p.database.trim() !== '');
    } else if (databaseFilter === 'no') {
      result = result.filter(p => !p.database || p.database.trim() === '');
    }

    // 2. Search Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowerTerm) ||
        p.repoUrl.toLowerCase().includes(lowerTerm) ||
        p.description.toLowerCase().includes(lowerTerm) ||
        p.techStack.some(t => t.toLowerCase().includes(lowerTerm))
      );
    }

    // 3. Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.lastDeployment.date).getTime() - new Date(a.lastDeployment.date).getTime();
      }
      if (sortBy === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'status') {
        // Priority: Failed > Building > Queued > Success
        const priority = { failed: 3, building: 2, queued: 1, success: 0 };
        return priority[b.lastDeployment.status] - priority[a.lastDeployment.status];
      }
      return 0;
    });

    return result;
  }, [projects, selectedCategory, statusFilter, frameworkFilter, databaseFilter, sourceFilter, searchTerm, sortBy]);

  const toggleProjectStatus = (projectId: string) => {
    toggleStatus(projectId);
    if (selectedProject?.id === projectId) {
      const updated = projects.find(p => p.id === projectId);
      if (updated) {
        const nextStatus = updated.status === 'active' ? 'redundant' : 'active';
        setSelectedProject({ ...updated, status: nextStatus });
      }
    }
  };

  const handleRefreshActivity = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/refresh-activity', { method: 'POST' });
      // Reload the page to fetch fresh activity data
      window.location.reload();
    } catch (err) {
      console.error('Failed to refresh activity:', err);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        activeFilter={sidebarFilter}
        onFilterChange={handleSidebarFilterChange}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        projects={projects}
        onSelectProject={(project) => setSelectedProject(project)}
      />

      {/* Main Content Area - adjusted for sidebar */}
      <div className="ml-48">
        <Navigation
          currentView={currentView}
          onSelectView={setCurrentView}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentView === 'analysis' ? (
          <AnalysisView projects={projects} />
        ) : (
          /* Dashboard View */
          <>
            {/* Top Section: Focus */}
            <WeeklyFocus projects={filteredProjects} onProjectClick={setSelectedProject} />
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
              
              {/* Main Content: Projects List */}
              <div className="lg:col-span-3">
                <QuickStats
                  projects={filteredProjects}
                  onProjectClick={setSelectedProject}
                />

                <ProjectToolbar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  frameworkFilter={frameworkFilter}
                  onFrameworkChange={setFrameworkFilter}
                  databaseFilter={databaseFilter}
                  onDatabaseChange={setDatabaseFilter}
                  availableFrameworks={availableFrameworks}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />

                {loading ? (
                  <div className="text-center py-20 text-slate-500">Loading projects...</div>
                ) : error ? (
                  <div className="text-center py-20 text-red-400">Failed to load projects.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredProjects.map(project => (
                        <AppCard
                          key={project.id}
                          project={project}
                          onClick={setSelectedProject}
                        />
                      ))}
                    </div>

                    {filteredProjects.length === 0 && (
                      <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
                        <p className="text-slate-500">No projects found matching your criteria.</p>
                      </div>
                    )}
                  </>
                )}
                
              </div>

              {/* Sidebar: Event Log */}
              <div className="hidden lg:block space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden sticky top-24">
                  <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-slate-400" />
                      <h3 className="font-semibold text-slate-100 text-sm">Event Log</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRefreshActivity}
                        disabled={isRefreshing}
                        className="p-1.5 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh Activity"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">LIVE</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {globalActivity.map((activity, i) => (
                      <div key={i} className="p-4 hover:bg-slate-700/50 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {activity.type === 'deployment' && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                            {activity.type === 'commit' && <GitCommit className="w-3.5 h-3.5 text-slate-500" />}
                            {!activity.type && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors cursor-pointer">
                                {activity.projectName || 'Unknown Project'}
                              </p>
                              <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                                {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{activity.title}</p>
                            {activity.url && (
                              <a
                                href={activity.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-indigo-400 font-mono underline"
                              >
                                Link
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
                </div>
              </div>

            </div>
          </>
        )}
        </main>
      </div>

      {selectedProject && (
        <AppDetails
          app={selectedProject}
          onClose={() => setSelectedProject(null)}
          onToggleStatus={toggleProjectStatus}
        />
      )}
    </div>
  );
}
