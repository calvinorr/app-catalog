'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ProjectCategory, ProjectData, ViewOption, SortOption, ProjectStatus, ProjectStage, DatabaseFilter, SourceFilter } from '@/types';
import { AppCard } from '@/components/AppCard';
import { AppDetails } from '@/components/AppDetails';
import { Navigation } from '@/components/Navigation';
import { WeeklyFocus } from '@/components/WeeklyFocus';
import { ProjectToolbar } from '@/components/ProjectToolbar';
import { AnalysisView } from '@/components/AnalysisView';
import { PortfolioView } from '@/components/PortfolioView';
import { QuickStats } from '@/components/QuickStats';
import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { EventLog } from '@/components/EventLog';
import { Pin } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useActivity } from '@/hooks/useActivity';

export default function App() {
  const { projects, loading, error, toggleStatus, updateStage, togglePin } = useProjects();
  const [currentView, setCurrentView] = useState<ViewOption>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>(ProjectCategory.All);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');
  const [databaseFilter, setDatabaseFilter] = useState<DatabaseFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sidebarDatabaseFilter, setSidebarDatabaseFilter] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const { activity: globalActivity } = useActivity(projects);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Sidebar filter state
  const [sidebarFilter, setSidebarFilter] = useState<{
    type: 'overview' | 'status' | 'framework' | 'category' | 'database';
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

  // Apply source filter for sidebar counts (this should match the main filter logic)
  const sourceFilteredProjects = useMemo(() => {
    if (sourceFilter === 'github') {
      return projects.filter(p => p.repoSlug && !p.vercelProject);
    } else if (sourceFilter === 'vercel') {
      return projects.filter(p => p.vercelProject);
    }
    return projects;
  }, [projects, sourceFilter]);

  // Extract unique frameworks for filter dropdown
  const availableFrameworks = useMemo(() => {
    const frameworks = new Set<string>();
    sourceFilteredProjects.forEach(p => {
      if (p.framework) frameworks.add(p.framework);
    });
    return Array.from(frameworks).sort();
  }, [sourceFilteredProjects]);

  // Handle sidebar filter changes
  const handleSidebarFilterChange = (
    type: 'overview' | 'status' | 'framework' | 'category' | 'database',
    value: string
  ) => {
    setSidebarFilter({ type, value });

    // Reset other filters and apply the sidebar filter
    setSelectedCategory(ProjectCategory.All);
    setStatusFilter('all');
    setFrameworkFilter('all');
    setDatabaseFilter('all');
    setSidebarDatabaseFilter(null);

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
    } else if (type === 'database') {
      setSidebarDatabaseFilter(value);
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

    // 1d. Database Filter (toolbar)
    if (databaseFilter === 'yes') {
      result = result.filter(p => p.database && p.database.trim() !== '');
    } else if (databaseFilter === 'no') {
      result = result.filter(p => !p.database || p.database.trim() === '');
    }

    // 1e. Sidebar Database Filter (specific database)
    if (sidebarDatabaseFilter) {
      if (sidebarDatabaseFilter === 'No Database') {
        result = result.filter(p => !p.database || p.database.trim() === '');
      } else {
        result = result.filter(p => p.database === sidebarDatabaseFilter);
      }
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
  }, [projects, selectedCategory, statusFilter, frameworkFilter, databaseFilter, sidebarDatabaseFilter, sourceFilter, searchTerm, sortBy]);

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

  const handleStageChange = (projectId: string, stage: ProjectStage) => {
    updateStage(projectId, stage);
    if (selectedProject?.id === projectId) {
      setSelectedProject({ ...selectedProject, stage });
    }
  };

  const handleTogglePin = (projectId: string) => {
    togglePin(projectId);
    if (selectedProject?.id === projectId) {
      const updated = projects.find(p => p.id === projectId);
      if (updated) {
        setSelectedProject({ ...updated, isPinned: !updated.isPinned });
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
      {/* Sidebar - uses source-filtered projects for accurate counts */}
      <Sidebar
        projects={sourceFilteredProjects}
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
      <div className="ml-64">
        <Navigation
          currentView={currentView}
          onSelectView={setCurrentView}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          onRefresh={handleRefreshActivity}
          isRefreshing={isRefreshing}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {currentView === 'analysis' ? (
          <AnalysisView projects={projects} />
        ) : currentView === 'portfolio' ? (
          <PortfolioView projects={projects} onProjectClick={setSelectedProject} />
        ) : currentView === 'pinned' ? (
          /* Pinned View - Two Column Layout */
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-100">Pinned Projects</h2>
              <span className="text-sm text-slate-400">
                {projects.filter(p => p.isPinned).length} pinned
              </span>
            </div>

            {/* Two Column Grid - Side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Column: Pinned Repos (GitHub only, no Vercel) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Pin className="w-5 h-5" />
                  Pinned Repos
                  <span className="text-sm text-slate-400 font-normal">
                    ({projects.filter(p => p.isPinned && p.repoSlug && !p.vercelProject).length})
                  </span>
                </h3>

                {projects.filter(p => p.isPinned && p.repoSlug && !p.vercelProject).length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30">
                    <Pin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No pinned repositories yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Pin GitHub repos without deployments.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.filter(p => p.isPinned && p.repoSlug && !p.vercelProject).map(project => (
                      <AppCard
                        key={project.id}
                        project={project}
                        onClick={setSelectedProject}
                        onTogglePin={handleTogglePin}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Pinned Deployments (Vercel projects) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Pin className="w-5 h-5" />
                  Pinned Deployments
                  <span className="text-sm text-slate-400 font-normal">
                    ({projects.filter(p => p.isPinned && p.vercelProject).length})
                  </span>
                </h3>

                {projects.filter(p => p.isPinned && p.vercelProject).length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30">
                    <Pin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No pinned deployments yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Pin projects with Vercel deployments.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.filter(p => p.isPinned && p.vercelProject).map(project => (
                      <AppCard
                        key={project.id}
                        project={project}
                        onClick={setSelectedProject}
                        onTogglePin={handleTogglePin}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
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
                          onTogglePin={handleTogglePin}
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
              <EventLog
                activity={globalActivity}
                onRefresh={handleRefreshActivity}
                isRefreshing={isRefreshing}
              />

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
          onStageChange={handleStageChange}
          onTogglePin={handleTogglePin}
        />
      )}
    </div>
  );
}
