
import React, { useMemo } from 'react';
import { ProjectData } from '@/types';
import { PieChart, Server, Database, Layers, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';

interface AnalysisViewProps {
  projects: ProjectData[];
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ projects }) => {
  const stats = useMemo(() => {
    // Tech Stack Calc
    const stackCounts: Record<string, number> = {};
    const dbCounts: Record<string, number> = {};
    const statusCounts = { success: 0, failed: 0, building: 0, queued: 0 };
    
    // Aggregated Activity
    // Sum up activity counts for all projects for each day to create a "Global Activity" map
    const globalCommits = new Array(90).fill(0).map((_, i) => ({
         date: projects[0].commitActivity[i]?.date || '',
         count: 0,
         level: 0 as 0|1|2|3|4
    }));

    projects.forEach(p => {
      // Tech
      p.techStack.forEach(t => stackCounts[t] = (stackCounts[t] || 0) + 1);
      if (p.database) dbCounts[p.database] = (dbCounts[p.database] || 0) + 1;
      
      // Status
      statusCounts[p.lastDeployment.status]++;

      // Activity
      p.commitActivity.forEach((day, idx) => {
        if (globalCommits[idx]) {
            globalCommits[idx].count += day.count;
        }
      });
    });

    // Recalculate levels for global
    globalCommits.forEach(d => {
        if (d.count === 0) d.level = 0;
        else if (d.count <= 2) d.level = 1;
        else if (d.count <= 5) d.level = 2;
        else if (d.count <= 10) d.level = 3;
        else d.level = 4;
    });

    // Database journey - find earliest project for each database
    const dbJourney: { db: string; firstProject: ProjectData; date: Date }[] = [];
    const dbFirstUse: Record<string, { project: ProjectData; date: Date }> = {};

    projects.forEach(p => {
      if (p.database) {
        const projectDate = p.lastCommitAt ? new Date(p.lastCommitAt) : new Date();
        if (!dbFirstUse[p.database] || projectDate < dbFirstUse[p.database].date) {
          dbFirstUse[p.database] = { project: p, date: projectDate };
        }
      }
    });

    Object.entries(dbFirstUse).forEach(([db, { project, date }]) => {
      dbJourney.push({ db, firstProject: project, date });
    });

    // Sort by date (earliest first)
    dbJourney.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
        stack: Object.entries(stackCounts).sort(([,a], [,b]) => b - a),
        db: Object.entries(dbCounts).sort(([,a], [,b]) => b - a),
        status: statusCounts,
        globalCommits,
        dbJourney
    };
  }, [projects]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Deployment Health
            </h3>
            <div className="flex items-center gap-8">
                <div className="relative w-24 h-24 rounded-full border-[6px] border-slate-700 flex items-center justify-center">
                   <div className="text-center">
                        <span className="block text-2xl font-bold text-slate-100">
                            {Math.round((stats.status.success / projects.length) * 100)}%
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">Success</span>
                   </div>
                   {/* CSS trick for a simple gauge would go here, simplified for now */}
                   <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-green-400" strokeDasharray={`${(stats.status.success / projects.length) * 289} 289`} />
                   </svg>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-slate-300">Passing ({stats.status.success})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-slate-300">Failing ({stats.status.failed})</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm md:col-span-2">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Global Contributions
            </h3>
            <div className="flex justify-center">
                <ActivityHeatmap data={stats.globalCommits} weeks={24} type="commits" />
            </div>
        </div>
      </div>

      {/* Detailed Stack Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
                <Server className="w-4 h-4" /> Tech Stack Distribution
            </h3>
            <div className="space-y-4">
                {stats.stack.map(([tech, count], i) => (
                    <div key={tech} className="flex items-center gap-4">
                        <span className="w-24 text-sm font-medium text-slate-200 truncate">{tech}</span>
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-slate-500'}`}
                                style={{ width: `${(count / projects.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-8 text-right">{count}</span>
                    </div>
                ))}
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
                <Database className="w-4 h-4" /> Database Usage
            </h3>
            {/* Bar chart for database distribution */}
            <div className="space-y-3">
                {stats.db.map(([db, count], i) => (
                    <div key={db} className="flex items-center gap-4">
                        <span className="w-24 text-sm font-medium text-slate-200 truncate">{db}</span>
                        <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${
                                  i === 0 ? 'bg-indigo-500' :
                                  i === 1 ? 'bg-purple-500' :
                                  i === 2 ? 'bg-pink-500' : 'bg-slate-500'
                                }`}
                                style={{ width: `${(count / projects.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-8 text-right">{count}</span>
                    </div>
                ))}
                {stats.db.length === 0 && <div className="text-slate-500 text-sm italic">No databases detected across projects.</div>}
            </div>
          </div>
      </div>

      {/* Database Learning Journey */}
      {stats.dbJourney.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Database Learning Journey
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Your progression through different database technologies based on earliest project activity.
          </p>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

            {/* Timeline items */}
            <div className="space-y-6">
              {stats.dbJourney.map((item, idx) => (
                <div key={item.db} className="relative flex items-start gap-6 pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    idx === 0 ? 'bg-indigo-500 border-indigo-400' :
                    idx === stats.dbJourney.length - 1 ? 'bg-emerald-500 border-emerald-400' :
                    'bg-slate-600 border-slate-500'
                  }`}>
                    <span className="text-[8px] font-bold text-white">{idx + 1}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-100">{item.db}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400">
                      First used in: <span className="text-indigo-400 font-medium">{item.firstProject.name}</span>
                    </div>
                    {item.firstProject.framework && (
                      <div className="text-xs text-slate-500 mt-1">
                        with {item.firstProject.framework}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
