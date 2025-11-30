'use client';

import React, { useMemo } from 'react';
import { LayoutDashboard, CheckCircle, AlertCircle, Code2, FolderKanban } from 'lucide-react';
import { ProjectData, ProjectCategory } from '@/types';

interface SidebarProps {
  projects: ProjectData[];
  activeFilter: {
    type: 'overview' | 'status' | 'framework' | 'category';
    value: string;
  };
  onFilterChange: (type: 'overview' | 'status' | 'framework' | 'category', value: string) => void;
}

export function Sidebar({ projects, activeFilter, onFilterChange }: SidebarProps) {
  // Calculate counts
  const counts = useMemo(() => {
    const statusCounts = {
      active: projects.filter(p => p.status === 'active').length,
      redundant: projects.filter(p => p.status === 'redundant').length,
    };

    const frameworkCounts = new Map<string, number>();
    projects.forEach(p => {
      if (p.framework) {
        frameworkCounts.set(p.framework, (frameworkCounts.get(p.framework) || 0) + 1);
      }
    });

    const categoryCounts = new Map<string, number>();
    projects.forEach(p => {
      const cat = p.category === ProjectCategory.All ? 'Other' : p.category;
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });

    return {
      total: projects.length,
      status: statusCounts,
      frameworks: frameworkCounts,
      categories: categoryCounts,
    };
  }, [projects]);

  const isActive = (type: string, value: string) => {
    return activeFilter.type === type && activeFilter.value === value;
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 w-48 bg-slate-900 text-white overflow-y-auto">
      {/* Logo / Title */}
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold">DevDash</h1>
        <p className="text-xs text-slate-400 mt-1">{counts.total} projects</p>
      </div>

      {/* Navigation Sections */}
      <nav className="p-3 space-y-6">
        {/* Overview */}
        <div>
          <button
            onClick={() => onFilterChange('overview', 'all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
              isActive('overview', 'all')
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </div>
            <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
              {counts.total}
            </span>
          </button>
        </div>

        {/* By Status */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Status
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => onFilterChange('status', 'active')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                isActive('status', 'active')
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Active</span>
              </div>
              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                {counts.status.active}
              </span>
            </button>
            <button
              onClick={() => onFilterChange('status', 'redundant')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                isActive('status', 'redundant')
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Redundant</span>
              </div>
              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                {counts.status.redundant}
              </span>
            </button>
          </div>
        </div>

        {/* By Framework */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Framework
          </h3>
          <div className="space-y-1">
            {Array.from(counts.frameworks.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([framework, count]) => (
                <button
                  key={framework}
                  onClick={() => onFilterChange('framework', framework)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive('framework', framework)
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    <span className="truncate">{framework}</span>
                  </div>
                  <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* By Category */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Category
          </h3>
          <div className="space-y-1">
            {Array.from(counts.categories.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, count]) => (
                <button
                  key={category}
                  onClick={() => onFilterChange('category', category)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive('category', category)
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" />
                    <span className="truncate">{category}</span>
                  </div>
                  <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
