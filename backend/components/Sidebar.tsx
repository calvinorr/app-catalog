'use client';

import React, { useMemo, useState } from 'react';
import { LayoutDashboard, CheckCircle, AlertCircle, Code2, FolderKanban, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectData, ProjectCategory } from '@/types';

interface SidebarProps {
  projects: ProjectData[];
  activeFilter: {
    type: 'overview' | 'status' | 'framework' | 'category' | 'database';
    value: string;
  };
  onFilterChange: (type: 'overview' | 'status' | 'framework' | 'category' | 'database', value: string) => void;
}

export function Sidebar({ projects, activeFilter, onFilterChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
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

    const databaseCounts = new Map<string, number>();
    let noDatabase = 0;
    projects.forEach(p => {
      if (p.database && p.database.trim()) {
        databaseCounts.set(p.database, (databaseCounts.get(p.database) || 0) + 1);
      } else {
        noDatabase++;
      }
    });
    if (noDatabase > 0) {
      databaseCounts.set('No Database', noDatabase);
    }

    return {
      total: projects.length,
      status: statusCounts,
      frameworks: frameworkCounts,
      categories: categoryCounts,
      databases: databaseCounts,
    };
  }, [projects]);

  const isActive = (type: string, value: string) => {
    return activeFilter.type === type && activeFilter.value === value;
  };

  return (
    <div className={`fixed left-0 top-0 bottom-0 bg-slate-900 text-white overflow-y-auto transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-48'}`}>
      {/* Logo / Title */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed ? (
          <div>
            <h1 className="text-lg font-bold">DevDash</h1>
            <p className="text-xs text-slate-400 mt-1">{counts.total} projects</p>
          </div>
        ) : (
          <div className="mx-auto">
            <span className="text-lg font-bold">D</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-slate-800 rounded-md transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className={`p-3 space-y-6 ${isCollapsed ? 'px-2' : ''}`}>
        {/* Overview */}
        <div>
          <button
            onClick={() => onFilterChange('overview', 'all')}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-md text-sm transition-colors ${
              isActive('overview', 'all')
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
            title={isCollapsed ? `Overview (${counts.total})` : undefined}
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Overview</span>}
            </div>
            {!isCollapsed && (
              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                {counts.total}
              </span>
            )}
          </button>
        </div>

        {/* By Status */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Status
            </h3>
          )}
          <div className="space-y-1">
            <button
              onClick={() => onFilterChange('status', 'active')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-md text-sm transition-colors ${
                isActive('status', 'active')
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isCollapsed ? `Active (${counts.status.active})` : undefined}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>Active</span>}
              </div>
              {!isCollapsed && (
                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                  {counts.status.active}
                </span>
              )}
            </button>
            <button
              onClick={() => onFilterChange('status', 'redundant')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-md text-sm transition-colors ${
                isActive('status', 'redundant')
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isCollapsed ? `Redundant (${counts.status.redundant})` : undefined}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>Redundant</span>}
              </div>
              {!isCollapsed && (
                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                  {counts.status.redundant}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* By Framework - only show top 5 when collapsed */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Framework
            </h3>
          )}
          <div className="space-y-1">
            {Array.from(counts.frameworks.entries())
              .sort(([, a], [, b]) => b - a)
              .slice(0, isCollapsed ? 3 : undefined)
              .map(([framework, count]) => (
                <button
                  key={framework}
                  onClick={() => onFilterChange('framework', framework)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive('framework', framework)
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title={isCollapsed ? `${framework} (${count})` : undefined}
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{framework}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* By Category */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Category
            </h3>
          )}
          <div className="space-y-1">
            {Array.from(counts.categories.entries())
              .sort(([, a], [, b]) => b - a)
              .slice(0, isCollapsed ? 3 : undefined)
              .map(([category, count]) => (
                <button
                  key={category}
                  onClick={() => onFilterChange('category', category)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive('category', category)
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title={isCollapsed ? `${category} (${count})` : undefined}
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{category}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* By Database */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Database
            </h3>
          )}
          <div className="space-y-1">
            {Array.from(counts.databases.entries())
              .sort(([a, countA], [b, countB]) => {
                if (a === 'No Database') return 1;
                if (b === 'No Database') return -1;
                return countB - countA;
              })
              .slice(0, isCollapsed ? 3 : undefined)
              .map(([database, count]) => (
                <button
                  key={database}
                  onClick={() => onFilterChange('database', database)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive('database', database)
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title={isCollapsed ? `${database} (${count})` : undefined}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{database}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
