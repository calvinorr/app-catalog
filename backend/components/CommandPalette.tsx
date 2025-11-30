'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { ProjectData } from '@/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectData[];
  onSelectProject: (project: ProjectData) => void;
}

export function CommandPalette({ isOpen, onClose, projects, onSelectProject }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter projects based on query
  const filteredProjects = useMemo(() => {
    if (!query.trim()) return projects;

    const lowerQuery = query.toLowerCase();
    return projects.filter(project =>
      project.name.toLowerCase().includes(lowerQuery) ||
      project.description.toLowerCase().includes(lowerQuery) ||
      project.framework.toLowerCase().includes(lowerQuery) ||
      project.techStack.some(tech => tech.toLowerCase().includes(lowerQuery))
    );
  }, [query, projects]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProjects]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredProjects.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredProjects[selectedIndex]) {
          onSelectProject(filteredProjects[selectedIndex]);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredProjects, onSelectProject, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-32"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-slate-700">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none text-slate-100 placeholder:text-slate-500 bg-transparent"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No projects found
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredProjects.map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => {
                    onSelectProject(project);
                    onClose();
                  }}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700 transition-colors ${
                    index === selectedIndex ? 'bg-indigo-600/20' : ''
                  }`}
                >
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-100 truncate">
                        {project.name}
                      </h4>
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {project.framework}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 truncate mt-0.5">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>Last activity: {new Date(project.lastDeployment.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0 ml-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono">Enter</kbd> Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono">Esc</kbd> Close
            </span>
          </div>
          <span className="text-slate-500">{filteredProjects.length} results</span>
        </div>
      </div>
    </div>
  );
}
