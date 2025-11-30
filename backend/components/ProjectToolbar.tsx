
import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { ProjectCategory, SortOption, ProjectStatus, DatabaseFilter, DeploymentFilter } from '@/types';

interface ProjectToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCategory: ProjectCategory;
  onCategoryChange: (cat: ProjectCategory) => void;
  statusFilter: ProjectStatus | 'all';
  onStatusChange: (status: ProjectStatus | 'all') => void;
  frameworkFilter: string;
  onFrameworkChange: (framework: string) => void;
  databaseFilter: DatabaseFilter;
  onDatabaseChange: (database: DatabaseFilter) => void;
  deploymentFilter: DeploymentFilter;
  onDeploymentChange: (deployment: DeploymentFilter) => void;
  availableFrameworks: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const ProjectToolbar: React.FC<ProjectToolbarProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  frameworkFilter,
  onFrameworkChange,
  databaseFilter,
  onDatabaseChange,
  deploymentFilter,
  onDeploymentChange,
  availableFrameworks,
  sortBy,
  onSortChange
}) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-2 mb-6 flex flex-col sm:flex-row gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter projects..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 text-slate-100 border-transparent focus:bg-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-500"
        />
      </div>

      {/* Filters & Sort */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
        <div className="relative flex items-center">
          <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as ProjectCategory)}
            className="pl-8 pr-8 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none hover:bg-slate-600 transition-colors font-medium min-w-[140px]"
          >
            {Object.values(ProjectCategory).map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as ProjectStatus | 'all')}
            className="pl-8 pr-8 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none hover:bg-slate-600 transition-colors font-medium min-w-[140px]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="redundant">Redundant</option>
          </select>
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
          <select
            value={frameworkFilter}
            onChange={(e) => onFrameworkChange(e.target.value)}
            className="pl-8 pr-8 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none hover:bg-slate-600 transition-colors font-medium min-w-[140px]"
          >
            <option value="all">All Frameworks</option>
            {availableFrameworks.map(fw => (
              <option key={fw} value={fw}>{fw}</option>
            ))}
          </select>
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
          <select
            value={databaseFilter}
            onChange={(e) => onDatabaseChange(e.target.value as DatabaseFilter)}
            className="pl-8 pr-8 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none hover:bg-slate-600 transition-colors font-medium min-w-[140px]"
          >
            <option value="all">All Databases</option>
            <option value="yes">Has Database</option>
            <option value="no">No Database</option>
          </select>
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
          <select
            value={deploymentFilter}
            onChange={(e) => onDeploymentChange(e.target.value as DeploymentFilter)}
            className="pl-8 pr-8 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none hover:bg-slate-600 transition-colors font-medium min-w-[160px]"
          >
            <option value="all">All Projects</option>
            <option value="vercel">Vercel Deployed</option>
            <option value="github-only">GitHub Only</option>
          </select>
        </div>

        <div className="relative flex items-center">
          <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="pl-8 pr-8 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none hover:bg-slate-600 transition-colors font-medium min-w-[160px]"
          >
            <option value="recent">Last Updated</option>
            <option value="status">Status Priority</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
      </div>
    </div>
  );
};
