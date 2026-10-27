import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { GraphNode, NodeType, NodeCategory } from '../types/graph';
import { searchNodes, FilterOptions } from '../data/searchAndProgress';

interface SearchBarProps {
  nodes: GraphNode[];
  onSelectNode: (node: GraphNode) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  nodes,
  onSelectNode,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<NodeType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NodeCategory | 'all'>('all');

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: "/" to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input/textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and search results
  const filterOptions: FilterOptions = useMemo(
    () => ({
      type: typeFilter,
      category: categoryFilter,
    }),
    [typeFilter, categoryFilter]
  );

  const results = useMemo(() => {
    return searchNodes(query, nodes, filterOptions);
  }, [query, nodes, filterOptions]);

  const handleSelect = (node: GraphNode) => {
    onSelectNode(node);
    setIsOpen(false);
    setQuery('');
  };

  const typeLabels: Record<string, string> = {
    all: 'Semua Tipe',
    root: 'Root',
    field: 'Bidang',
    specialization: 'Spesialisasi',
    role: 'Peran',
    skill: 'Skill',
    tool: 'Tool',
  };

  const categoryLabels: Record<string, string> = {
    all: 'Semua Kategori',
    language: 'Bahasa',
    framework: 'Framework',
    database: 'Database',
    tooling: 'Tooling',
    platform: 'Platform',
    concept: 'Konsep',
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <svg
          className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari node, peran, atau skill... (tekan /)"
          className="w-full pl-9 pr-14 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition shadow-inner"
        />

        <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded select-none pointer-events-none">
          /
        </kbd>
      </div>

      {/* Dropdown Results and Filter Controls */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-96 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Filters Bar */}
          <div className="p-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-2 text-[11px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NodeType | 'all')}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-sky-500"
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as NodeCategory | 'all')
              }
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-sky-500"
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {(typeFilter !== 'all' || categoryFilter !== 'all' || query) && (
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('all');
                  setCategoryFilter('all');
                  setQuery('');
                }}
                className="ml-auto text-sky-400 hover:text-sky-300 text-[10px] font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto max-h-72 divide-y divide-slate-800/50">
            {results.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Tidak ada node yang cocok dengan pencarian Anda.
              </div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left p-3 hover:bg-slate-800/60 flex items-center justify-between group transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-200 group-hover:text-sky-400 transition">
                        {item.label}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                        {item.type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {item.category && (
                    <span className="text-[10px] text-slate-400 font-mono capitalize ml-2">
                      {item.category}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
