'use client';

import React, { useMemo, useState } from 'react';
import { LayoutDashboard, CheckCircle, AlertCircle, Code2, FolderKanban, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectData, ProjectCategory } from '@/types';

interface SidebarProps {
  projects: ProjectData[];
  activeFilter: {
    type: 'overview' | 'status' | 'framework' | 'category' | 'database';
    value: string;
  };
  onFilterChange: (type: 'overview' | 'status' | 'framework' | 'category' | 'database', value: string) => void;
}

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, icon, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-300">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-2 pb-2 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ projects, activeFilter, onFilterChange }: SidebarProps) {
  // Accordion state - all sections start expanded
  const [openSections, setOpenSections] = useState({
    status: true,
    framework: true,
    category: true,
    database: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const FilterButton = ({
    type,
    value,
    icon,
    label,
    count
  }: {
    type: 'status' | 'framework' | 'category' | 'database';
    value: string;
    icon: React.ReactNode;
    label: string;
    count: number;
  }) => (
    <button
      onClick={() => onFilterChange(type, value)}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive(type, value)
          ? 'bg-indigo-600 text-white'
          : 'hover:bg-slate-800 text-slate-300'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
        isActive(type, value)
          ? 'bg-indigo-500 text-white'
          : 'bg-slate-700 text-slate-400'
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white overflow-y-auto border-r border-slate-700">
      {/* Logo / Title */}
      <div className="p-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">DevDash</h1>
        <p className="text-sm text-slate-400 mt-1">{counts.total} projects</p>
      </div>

      {/* Overview Button */}
      <div className="p-3 border-b border-slate-700/50">
        <button
          onClick={() => onFilterChange('overview', 'all')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isActive('overview', 'all')
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5" />
            <span>All Projects</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isActive('overview', 'all')
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-700 text-slate-400'
          }`}>
            {counts.total}
          </span>
        </button>
      </div>

      {/* Accordion Sections */}
      <nav className="flex flex-col">
        {/* Status Section */}
        <AccordionSection
          title="Status"
          icon={<CheckCircle className="w-4 h-4" />}
          isOpen={openSections.status}
          onToggle={() => toggleSection('status')}
        >
          <FilterButton
            type="status"
            value="active"
            icon={<CheckCircle className="w-4 h-4 text-green-400" />}
            label="Active"
            count={counts.status.active}
          />
          <FilterButton
            type="status"
            value="redundant"
            icon={<AlertCircle className="w-4 h-4 text-slate-400" />}
            label="Redundant"
            count={counts.status.redundant}
          />
        </AccordionSection>

        {/* Framework Section */}
        <AccordionSection
          title="Framework"
          icon={<Code2 className="w-4 h-4" />}
          isOpen={openSections.framework}
          onToggle={() => toggleSection('framework')}
        >
          {Array.from(counts.frameworks.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([framework, count]) => (
              <FilterButton
                key={framework}
                type="framework"
                value={framework}
                icon={<Code2 className="w-4 h-4 text-blue-400" />}
                label={framework}
                count={count}
              />
            ))}
        </AccordionSection>

        {/* Category Section */}
        <AccordionSection
          title="Category"
          icon={<FolderKanban className="w-4 h-4" />}
          isOpen={openSections.category}
          onToggle={() => toggleSection('category')}
        >
          {Array.from(counts.categories.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => (
              <FilterButton
                key={category}
                type="category"
                value={category}
                icon={<FolderKanban className="w-4 h-4 text-purple-400" />}
                label={category}
                count={count}
              />
            ))}
        </AccordionSection>

        {/* Database Section */}
        <AccordionSection
          title="Database"
          icon={<Database className="w-4 h-4" />}
          isOpen={openSections.database}
          onToggle={() => toggleSection('database')}
        >
          {Array.from(counts.databases.entries())
            .sort(([a, countA], [b, countB]) => {
              if (a === 'No Database') return 1;
              if (b === 'No Database') return -1;
              return countB - countA;
            })
            .map(([database, count]) => (
              <FilterButton
                key={database}
                type="database"
                value={database}
                icon={<Database className="w-4 h-4 text-amber-400" />}
                label={database}
                count={count}
              />
            ))}
        </AccordionSection>
      </nav>
    </div>
  );
}
