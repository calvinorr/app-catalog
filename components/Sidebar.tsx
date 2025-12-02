import React, { useState } from 'react';
import { ScrollText, GitCommit, CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ActivityItem } from '../types';

interface SidebarProps {
  activity: ActivityItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activity }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`hidden lg:block space-y-6 transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-full'}`}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900 text-sm">Event Log</h3>
            </div>
          )}
          {!isCollapsed && (
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">LIVE</span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1 hover:bg-slate-200 rounded transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
            {activity.map((item, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {item.type === 'deployment' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                    {item.type === 'commit' && <GitCommit className="w-3.5 h-3.5 text-slate-400" />}
                    {!item.type && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors cursor-pointer">
                        {item.projectName || 'Unknown Project'}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.title}</p>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-600 font-mono underline"
                      >
                        Link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isCollapsed && (
          <div className="p-2 flex flex-col items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-400" />
            <span className="text-[9px] text-slate-400 font-mono writing-vertical">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
};
