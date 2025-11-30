
import React, { useMemo } from 'react';
import { ProjectData } from '../types';
import { PieChart, Server, Database, Layers, CheckCircle, XCircle } from 'lucide-react';
import { ActivityHeatmap } from './ActivityHeatmap';
import { useActivity } from '../hooks/useActivity';
import { useAggregatedActivity } from '../hooks/useAggregatedActivity';

interface AnalysisViewProps {
  projects: ProjectData[];
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ projects }) => {
  // Fetch real activity data
  const { activity } = useActivity(projects);
  const { globalCommits } = useAggregatedActivity(activity, 365);

  const stats = useMemo(() => {
    // Tech Stack Calc
    const stackCounts: Record<string, number> = {};
    const dbCounts: Record<string, number> = {};
    const statusCounts = { success: 0, failed: 0, building: 0, queued: 0 };

    projects.forEach(p => {
      // Tech
      p.techStack.forEach(t => stackCounts[t] = (stackCounts[t] || 0) + 1);
      if (p.database) dbCounts[p.database] = (dbCounts[p.database] || 0) + 1;

      // Status
      statusCounts[p.lastDeployment.status]++;
    });

    return {
        stack: Object.entries(stackCounts).sort(([,a], [,b]) => b - a),
        db: Object.entries(dbCounts).sort(([,a], [,b]) => b - a),
        status: statusCounts
    };
  }, [projects]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Deployment Health
            </h3>
            <div className="flex items-center gap-8">
                <div className="relative w-24 h-24 rounded-full border-[6px] border-slate-100 flex items-center justify-center">
                   <div className="text-center">
                        <span className="block text-2xl font-bold text-slate-900">
                            {Math.round((stats.status.success / projects.length) * 100)}%
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">Success</span>
                   </div>
                   {/* CSS trick for a simple gauge would go here, simplified for now */}
                   <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-green-500" strokeDasharray={`${(stats.status.success / projects.length) * 289} 289`} />
                   </svg>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-slate-600">Passing ({stats.status.success})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-slate-600">Failing ({stats.status.failed})</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Global Contributions
            </h3>
            <div className="flex justify-center">
                <ActivityHeatmap data={globalCommits} weeks={52} type="commits" />
            </div>
        </div>
      </div>

      {/* Detailed Stack Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
                <Server className="w-4 h-4" /> Tech Stack Distribution
            </h3>
            <div className="space-y-4">
                {stats.stack.map(([tech, count], i) => (
                    <div key={tech} className="flex items-center gap-4">
                        <span className="w-24 text-sm font-medium text-slate-700 truncate">{tech}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-slate-400'}`}
                                style={{ width: `${(count / projects.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-slate-500 font-mono w-8 text-right">{count}</span>
                    </div>
                ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
                <Database className="w-4 h-4" /> Database Usage
            </h3>
            <div className="flex flex-wrap gap-3">
                {stats.db.map(([db, count]) => (
                    <div key={db} className="group relative flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-default">
                        <div className="text-center">
                            <div className="text-lg font-bold text-slate-700 group-hover:text-indigo-700">{db}</div>
                            <div className="text-xs text-slate-400 mt-1">{count} projects</div>
                        </div>
                    </div>
                ))}
                {stats.db.length === 0 && <div className="text-slate-400 text-sm italic">No databases detected across projects.</div>}
            </div>
          </div>
      </div>

    </div>
  );
};
