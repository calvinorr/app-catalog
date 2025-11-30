
import React from 'react';
import { ActivityPoint } from '../types';

interface ActivityHeatmapProps {
  data: ActivityPoint[];
  type?: 'commits' | 'deployments';
  weeks?: number; // How many weeks to show
  className?: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  type = 'commits',
  weeks = 12,
  className = ''
}) => {
  // Take the most recent data (last N days) and reverse to show oldest to newest
  const totalDays = weeks * 7;
  const displayData = data.length > totalDays
    ? data.slice(data.length - totalDays)
    : data;

  // Chunk into weeks for the grid
  const weeksData: ActivityPoint[][] = [];
  for (let i = 0; i < displayData.length; i += 7) {
    weeksData.push(displayData.slice(i, i + 7));
  }

  // Color mappings
  const getCommitColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-slate-100';
      case 1: return 'bg-emerald-200';
      case 2: return 'bg-emerald-300';
      case 3: return 'bg-emerald-500';
      case 4: return 'bg-emerald-700';
      default: return 'bg-slate-100';
    }
  };

  const getDeploymentColor = (point: ActivityPoint) => {
    if (point.count === 0) return 'bg-slate-100';
    if (point.status === 'failed') return 'bg-red-400';
    // Intensity of success based on count
    if (point.level === 1) return 'bg-blue-200';
    if (point.level >= 2) return 'bg-blue-500';
    return 'bg-slate-100';
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex gap-[3px]">
        {weeksData.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-[3px]">
            {week.map((day, dIdx) => (
              <div
                key={`${wIdx}-${dIdx}`}
                className={`w-2.5 h-2.5 rounded-[1px] transition-colors ${
                  type === 'commits' ? getCommitColor(day.level) : getDeploymentColor(day)
                }`}
                title={`${day.date}: ${day.count} ${type === 'commits' ? 'commits' : 'deployments'} ${day.status === 'failed' ? '(Failed)' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-mono">
        <span>Less</span>
        <div className="flex gap-[2px]">
           <div className={`w-2 h-2 rounded-[1px] ${type === 'commits' ? 'bg-slate-100' : 'bg-slate-100'}`} />
           <div className={`w-2 h-2 rounded-[1px] ${type === 'commits' ? 'bg-emerald-200' : 'bg-blue-200'}`} />
           <div className={`w-2 h-2 rounded-[1px] ${type === 'commits' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
           {type === 'deployments' && <div className="w-2 h-2 rounded-[1px] bg-red-400" />}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
