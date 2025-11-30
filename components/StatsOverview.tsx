
import React, { useMemo } from 'react';
import { ProjectData } from '../types';
import { Activity, Zap, CheckCircle2, AlertTriangle, PieChart } from 'lucide-react';

interface StatsOverviewProps {
  projects: ProjectData[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ projects }) => {
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const failedProjects = projects.filter(p => p.lastDeployment.status === 'failed').length;
    const successRate = Math.round(((totalProjects - failedProjects) / totalProjects) * 100);
    
    // Calculate tech stack distribution
    const stackCounts: Record<string, number> = {};
    projects.forEach(p => {
      p.techStack.forEach(t => {
        stackCounts[t] = (stackCounts[t] || 0) + 1;
      });
    });
    
    const topStack = Object.entries(stackCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return { totalProjects, failedProjects, successRate, topStack };
  }, [projects]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Health Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Health</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${stats.successRate === 100 ? 'text-green-600' : stats.successRate > 80 ? 'text-slate-900' : 'text-red-600'}`}>
              {stats.successRate}%
            </span>
            <span className="text-xs text-slate-500">Uptime</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${stats.failedProjects === 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {stats.failedProjects === 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
      </div>

      {/* Deployments Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Velocity</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">High</span>
            <span className="text-xs text-green-600 font-medium">+12%</span>
          </div>
        </div>
        <div className="p-3 rounded-full bg-blue-50 text-blue-600">
          <Zap className="w-5 h-5" />
        </div>
      </div>

      {/* Tech Stack Distribution */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2 flex items-center justify-between">
         <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dominant Tech Stack</p>
          <div className="flex gap-4">
            {stats.topStack.map(([tech, count], idx) => (
              <div key={tech} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-indigo-500' : idx === 1 ? 'bg-purple-500' : 'bg-pink-500'}`}></div>
                <span className="text-sm font-medium text-slate-700">{tech}</span>
                <span className="text-xs text-slate-400">({Math.round(count / stats.totalProjects * 100)}%)</span>
              </div>
            ))}
          </div>
         </div>
         <div className="hidden sm:block p-3 rounded-full bg-slate-50 text-slate-400">
            <PieChart className="w-5 h-5" />
         </div>
      </div>
    </div>
  );
};
