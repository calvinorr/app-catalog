'use client';

import React, { useState } from 'react';
import { ScrollText, GitCommit, CheckCircle, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { ActivityItem } from '@/types';

interface EventLogProps {
  activity: ActivityItem[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function EventLog({ activity, onRefresh, isRefreshing }: EventLogProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-full'}`}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden sticky top-24">
        <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-100 text-sm">Event Log</h3>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <>
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh Activity"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">LIVE</span>
              </>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 hover:bg-slate-700 rounded-md transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? (
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto custom-scrollbar">
            {activity.map((item, i) => (
              <div key={i} className="p-4 hover:bg-slate-700/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {item.type === 'deployment' && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                    {item.type === 'commit' && <GitCommit className="w-3.5 h-3.5 text-slate-500" />}
                    {!item.type && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors cursor-pointer">
                        {item.projectName || 'Unknown Project'}
                      </p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.title}</p>
                    {item.url && (
                      <a
                        href={item.url}
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
        )}

        {isCollapsed && (
          <div className="p-2 flex flex-col items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-500" />
          </div>
        )}
      </div>
    </div>
  );
}
