
import React from 'react';
import { ViewOption, SourceFilter } from '@/types';
import { TerminalSquare, LayoutDashboard, PieChart, Github, Pin, Briefcase, RefreshCw } from 'lucide-react';

interface NavigationProps {
  currentView: ViewOption;
  onSelectView: (view: ViewOption) => void;
  sourceFilter: SourceFilter;
  onSourceFilterChange: (filter: SourceFilter) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  sourceFilter,
  onSourceFilterChange,
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <nav className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <TerminalSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight block leading-none">
                DevDash
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Source Filter Toggle */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => onSourceFilterChange('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  sourceFilter === 'all'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => onSourceFilterChange('github')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  sourceFilter === 'github'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </button>
              <button
                onClick={() => onSourceFilterChange('vercel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  sourceFilter === 'vercel'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 76 65" fill="currentColor">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
                Vercel
              </button>
            </div>

            {/* View Tabs */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => onSelectView('dashboard')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => onSelectView('pinned')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentView === 'pinned'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Pin className="w-4 h-4" />
                Pinned
              </button>
              <button
                onClick={() => onSelectView('analysis')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentView === 'analysis'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PieChart className="w-4 h-4" />
                Analysis
              </button>
              <button
                onClick={() => onSelectView('portfolio')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentView === 'portfolio'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Portfolio
              </button>
            </div>

            {/* Sync Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                title="Sync projects from GitHub & Vercel"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Syncing...' : 'Sync'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
