import React, { useMemo } from 'react';
import type { GraphNode, GraphData } from '../types/graph';
import {
  getTechStackForRole,
  groupTechStackByCategory,
  computeLearningOrder,
  extractDomain,
} from '../data/traversal';
import { calculateRoleProgress } from '../data/searchAndProgress';

interface DetailPanelProps {
  node: GraphNode;
  data: GraphData;
  breadcrumb?: string[]; // Node IDs in path order [root, ..., target]
  learnedNodeIds: Set<string>;
  onToggleLearned: (nodeId: string) => void;
  onResetProgress?: () => void;
  onClose: () => void;
  onSelectNode: (node: GraphNode) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  node,
  data,
  breadcrumb = [],
  learnedNodeIds,
  onToggleLearned,
  onResetProgress,
  onClose,
  onSelectNode,
}) => {
  const isRole = node.type === 'role';
  const isSkillOrTool = node.type === 'skill' || node.type === 'tool';

  // Map nodes for fast label lookup in breadcrumb
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const n of data.nodes) {
      map.set(n.id, n);
    }
    return map;
  }, [data.nodes]);

  // For role nodes: compute tech stack and learning order
  const roleTechStack = useMemo(() => {
    if (!isRole) return [];
    return getTechStackForRole(node.id, data);
  }, [node.id, isRole, data]);

  const groupedStack = useMemo(() => {
    if (!isRole) return [];
    return groupTechStackByCategory(roleTechStack);
  }, [isRole, roleTechStack]);

  const learningOrder = useMemo(() => {
    if (!isRole) return [];
    return computeLearningOrder(roleTechStack, data);
  }, [isRole, roleTechStack, data]);

  // Role progress (X dari Y skill, percentage)
  const roleProgress = useMemo(() => {
    if (!isRole) return null;
    return calculateRoleProgress(roleTechStack, learnedNodeIds);
  }, [isRole, roleTechStack, learnedNodeIds]);

  // Find prerequisites & dependents for individual skill/tool nodes
  const { directPrereqs, directDependents } = useMemo(() => {
    if (!isSkillOrTool) return { directPrereqs: [], directDependents: [] };

    const prereqs: GraphNode[] = [];
    const dependents: GraphNode[] = [];

    for (const edge of data.edges) {
      if (edge.kind === 'prerequisite') {
        if (edge.target === node.id) {
          const src = nodeMap.get(edge.source);
          if (src) prereqs.push(src);
        } else if (edge.source === node.id) {
          const tgt = nodeMap.get(edge.target);
          if (tgt) dependents.push(tgt);
        }
      }
    }

    return { directPrereqs: prereqs, directDependents: dependents };
  }, [isSkillOrTool, node.id, data, nodeMap]);

  const typeBadgeColors: Record<string, string> = {
    role: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    skill: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    tool: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    specialization: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    field: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    root: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  };

  const isCurrentNodeLearned = learnedNodeIds.has(node.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detail ${node.label}`}
      className="fixed inset-x-0 bottom-0 max-h-[85vh] md:max-h-none md:inset-y-0 md:left-auto md:right-0 md:w-96 z-40 bg-slate-900/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-800 shadow-2xl flex flex-col text-slate-200 transition-all duration-300 animate-in slide-in-from-bottom md:slide-in-from-right"
    >
      {/* Breadcrumb Path Banner */}
      {breadcrumb.length > 0 && (
        <nav
          aria-label="Breadcrumb jalur"
          className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center flex-wrap gap-1 text-[11px] text-slate-400 font-medium"
        >
          {breadcrumb.map((id, idx) => {
            const bNode = nodeMap.get(id);
            if (!bNode) return null;
            const isLast = idx === breadcrumb.length - 1;
            return (
              <React.Fragment key={id}>
                {idx > 0 && <span className="text-slate-600">›</span>}
                <button
                  type="button"
                  onClick={() => onSelectNode(bNode)}
                  className={`hover:text-sky-300 transition ${
                    isLast ? 'text-sky-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {bNode.label}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Panel Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-800/80 bg-slate-900/80 sticky top-0 z-10">
        <div>
          <span
            className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border mb-1.5 ${
              typeBadgeColors[node.type] || 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {node.type}
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
            {node.label}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition"
          aria-label="Tutup panel"
          title="Tutup (Esc)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Panel Body Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
        {/* Role Learning Progress Bar */}
        {isRole && roleProgress && (
          <section className="bg-slate-800/50 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Progres Penguasaan Skill
              </span>
              <span className="font-bold text-emerald-400">
                {roleProgress.completed} dari {roleProgress.total} ({roleProgress.percentage}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${roleProgress.percentage}%` }}
              ></div>
            </div>
          </section>
        )}

        {/* Skill/Tool Checkbox Tracker for current node */}
        {isSkillOrTool && (
          <section className="bg-slate-800/40 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
            <label
              htmlFor={`tracker-${node.id}`}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <input
                id={`tracker-${node.id}`}
                type="checkbox"
                checked={isCurrentNodeLearned}
                onChange={() => onToggleLearned(node.id)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500"
              />
              <span
                className={`text-xs font-medium ${
                  isCurrentNodeLearned
                    ? 'text-emerald-400 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                {isCurrentNodeLearned
                  ? '✓ Sudah saya pelajari'
                  : 'Tandai sudah saya pelajari'}
              </span>
            </label>
          </section>
        )}

        {/* Deskripsi */}
        {node.description && (
          <section>
            <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
              Tentang
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm bg-slate-800/40 border border-slate-800 p-3.5 rounded-lg">
              {node.description}
            </p>
          </section>
        )}

        {/* Jika Skill / Tool Tunggal */}
        {isSkillOrTool && (
          <section className="space-y-4">
            {node.category && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs uppercase font-medium">
                  Kategori:
                </span>
                <span className="capitalize px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
                  {node.category}
                </span>
              </div>
            )}

            {node.docsUrl && (
              <div className="pt-1">
                <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
                  Dokumentasi Resmi
                </h3>
                <a
                  href={node.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-sky-600/10 hover:bg-sky-600/20 border border-sky-500/30 text-sky-400 hover:text-sky-300 transition group"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <span className="font-semibold text-sm">Buka Docs</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                    {extractDomain(node.docsUrl)}
                  </span>
                </a>
              </div>
            )}

            {/* Prasyarat & Kelanjutan */}
            {directPrereqs.length > 0 && (
              <div>
                <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
                  Prasyarat Belajar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {directPrereqs.map((prereq) => (
                    <button
                      key={prereq.id}
                      type="button"
                      onClick={() => onSelectNode(prereq)}
                      className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition flex items-center gap-1.5"
                    >
                      <span>←</span>
                      <span>{prereq.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {directDependents.length > 0 && (
              <div>
                <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
                  Membuka Peluang Belajar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {directDependents.map((dep) => (
                    <button
                      key={dep.id}
                      type="button"
                      onClick={() => onSelectNode(dep)}
                      className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 transition flex items-center gap-1.5"
                    >
                      <span>{dep.label}</span>
                      <span>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Jika Role: Tampilkan Tech Stack Terkelompok dengan Checkbox Progress */}
        {isRole && (
          <section className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                  Tech Stack Terkait ({roleTechStack.length})
                </h3>
              </div>

              <div className="space-y-4">
                {groupedStack.map((group) => (
                  <div
                    key={group.category}
                    className="bg-slate-800/40 border border-slate-800 rounded-lg p-3.5 space-y-2.5"
                  >
                    <span className="text-xs font-semibold text-slate-300 block">
                      {group.label}
                    </span>
                    <div className="space-y-1.5">
                      {group.items.map((item) => {
                        const learned = learnedNodeIds.has(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-2 rounded border transition text-xs ${
                              learned
                                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                                : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={learned}
                                onChange={() => onToggleLearned(item.id)}
                                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500"
                                title="Tandai sudah dipelajari"
                              />
                              <button
                                type="button"
                                onClick={() => onSelectNode(item)}
                                className={`font-medium hover:text-sky-400 transition text-left ${
                                  learned ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {item.label}
                              </button>
                            </div>

                            {item.docsUrl && (
                              <a
                                href={item.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-sky-400 text-[11px] font-mono transition"
                                title={`Buka ${item.docsUrl}`}
                              >
                                <span>{extractDomain(item.docsUrl)}</span>
                                <span>↗</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Urutan Belajar yang Disarankan (Topological Order) */}
            {learningOrder.length > 0 && (
              <div>
                <h3 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
                  Urutan Belajar yang Disarankan
                </h3>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Berdasarkan dependensi dan keterkaitan prasyarat (prerequisite):
                </p>

                <ol className="relative border-l border-slate-800 ml-2.5 space-y-3">
                  {learningOrder.map((step, idx) => {
                    const stepLearned = learnedNodeIds.has(step.id);
                    return (
                      <li key={step.id} className="ml-4">
                        <div
                          className={`absolute -left-1.5 mt-1 w-3 h-3 rounded-full border ${
                            stepLearned
                              ? 'border-emerald-400 bg-emerald-500'
                              : 'border-sky-500 bg-slate-950'
                          }`}
                        ></div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-sky-400">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => onSelectNode(step)}
                              className={`font-medium hover:text-sky-300 transition text-xs ${
                                stepLearned ? 'text-emerald-400' : 'text-slate-200'
                              }`}
                            >
                              {step.label}
                            </button>
                          </div>
                          {step.docsUrl && (
                            <a
                              href={step.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-slate-400 hover:text-sky-400 font-mono transition"
                            >
                              {extractDomain(step.docsUrl)} ↗
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* Global Progress Reset Button (Footer) */}
        {onResetProgress && (
          <div className="pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onResetProgress}
              className="w-full py-2 px-3 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-rose-900/30 rounded-lg transition font-medium flex items-center justify-center gap-2"
            >
              <span>Reset Seluruh Progres Belajar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
