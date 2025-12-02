
import React, { useMemo, useState } from 'react';
import { ProjectCategory, ProjectData, ViewOption, SortOption, ProjectStatus } from './types';
import { AppCard } from './components/AppCard';
import { AppDetails } from './components/AppDetails';
import { Navigation } from './components/Navigation';
import { WeeklyFocus } from './components/WeeklyFocus';
import { ProjectToolbar } from './components/ProjectToolbar';
import { AnalysisView } from './components/AnalysisView';
import { PinnedPanel } from './backend/components/PinnedPanel';
import { Sidebar } from './components/Sidebar';
import { Pin } from 'lucide-react';
import { useProjects } from './hooks/useProjects';
import { useActivity } from './hooks/useActivity';

export default function App() {
  const { projects, loading, error, toggleStatus, togglePin } = useProjects();
  const [currentView, setCurrentView] = useState<ViewOption>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>(ProjectCategory.All);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const { activity: globalActivity } = useActivity(projects);

  // Filter & Sort Logic
  const filteredProjects = useMemo(() => {
    let result = projects;

    // 1. Category Filter
    if (selectedCategory !== ProjectCategory.All) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 1b. Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
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
  }, [projects, selectedCategory, statusFilter, searchTerm, sortBy]);

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navigation
        currentView={currentView}
        onSelectView={setCurrentView}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:pr-72">
        
        {currentView === 'analysis' ? (
          <AnalysisView projects={projects} />
        ) : currentView === 'pinned' ? (
          /* Pinned View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Pinned Projects</h2>
              <span className="text-sm text-slate-500">
                {projects.filter(p => p.isPinned).length} pinned
              </span>
            </div>
            {projects.filter(p => p.isPinned).length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
                <Pin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">No pinned projects yet.</p>
                <p className="text-sm text-slate-400 mt-1">Pin projects from the Dashboard for quick access.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.filter(p => p.isPinned).map(project => (
                  <AppCard
                    key={project.id}
                    project={project}
                    onClick={setSelectedProject}
                    onTogglePin={togglePin}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Dashboard View */
          <>
            {/* Top Section: Focus */}
            <WeeklyFocus projects={projects} />
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
              
              {/* Main Content: Projects List */}
              <div className="lg:col-span-3">
                <ProjectToolbar 
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />

                {loading ? (
                  <div className="text-center py-20 text-slate-400">Loading projects...</div>
                ) : error ? (
                  <div className="text-center py-20 text-red-500">Failed to load projects.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredProjects.map(project => (
                        <AppCard
                          key={project.id}
                          project={project}
                          onClick={setSelectedProject}
                          onTogglePin={togglePin}
                        />
                      ))}
                    </div>
                    
                    {filteredProjects.length === 0 && (
                      <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400">No projects found matching your criteria.</p>
                      </div>
                    )}
                  </>
                )}
                
              </div>

              {/* Sidebar: Event Log */}
              <Sidebar activity={globalActivity} />

            </div>
          </>
        )}
      </main>

      {selectedProject && (
        <AppDetails
          app={selectedProject}
          onClose={() => setSelectedProject(null)}
          onToggleStatus={toggleProjectStatus}
        />
      )}

      <PinnedPanel
        projects={projects}
        onTogglePin={togglePin}
        onProjectClick={setSelectedProject}
      />
    </div>
  );
}
