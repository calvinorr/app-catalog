
import React from 'react';
import { ViewOption } from '@/types';
import { TerminalSquare, LayoutDashboard, PieChart } from 'lucide-react';

interface NavigationProps {
  currentView: ViewOption;
  onSelectView: (view: ViewOption) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onSelectView }) => {
  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg shadow-sm">
              <TerminalSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight block leading-none">
                DevDash
              </span>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => onSelectView('dashboard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => onSelectView('analysis')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentView === 'analysis'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Analysis
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
