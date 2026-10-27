import React, { useState } from 'react';
import type { GraphData, GraphNode, NodeType } from '../types/graph';

interface AccessibleTreeViewProps {
  data: GraphData;
  learnedNodeIds: Set<string>;
  onSelectNode: (node: GraphNode) => void;
  onToggleLearned: (nodeId: string) => void;
}

export const AccessibleTreeView: React.FC<AccessibleTreeViewProps> = ({
  data,
  learnedNodeIds,
  onSelectNode,
  onToggleLearned,
}) => {
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all');

  // Build children hierarchy by part_of
  const childrenMap = new Map<string, GraphNode[]>();
  const nodeMap = new Map<string, GraphNode>();

  for (const n of data.nodes) {
    nodeMap.set(n.id, n);
  }

  for (const edge of data.edges) {
    if (edge.kind === 'part_of') {
      const list = childrenMap.get(edge.source) || [];
      const tgt = nodeMap.get(edge.target);
      if (tgt) {
        list.push(tgt);
      }
      childrenMap.set(edge.source, list);
    }
  }

  const rootNodes = data.nodes.filter((n) => n.type === 'root');

  const filteredNodes = data.nodes.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const renderBranch = (node: GraphNode, level = 0) => {
    const children = childrenMap.get(node.id) || [];
    const isLearned = learnedNodeIds.has(node.id);
    const isSkillOrTool = node.type === 'skill' || node.type === 'tool';

    return (
      <li key={node.id} className="space-y-1">
        <div
          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition"
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div className="flex items-center gap-2">
            {isSkillOrTool && (
              <input
                type="checkbox"
                aria-label={`Tandai ${node.label} sudah dipelajari`}
                checked={isLearned}
                onChange={() => onToggleLearned(node.id)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500 min-w-[20px]"
              />
            )}
            <button
              type="button"
              onClick={() => onSelectNode(node)}
              className="text-xs font-semibold text-slate-200 hover:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 rounded px-1 text-left min-h-[44px] flex items-center"
            >
              <span className={isLearned ? 'line-through text-slate-400' : ''}>
                {node.label}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {node.type}
            </span>
            {node.docsUrl && (
              <a
                href={node.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus:ring-2 focus:ring-sky-400"
                aria-label={`Buka dokumentasi resmi ${node.label}`}
              >
                ↗
              </a>
            )}
          </div>
        </div>

        {children.length > 0 && (
          <ul className="space-y-1 pl-2 border-l border-slate-800">
            {children.map((child) => renderBranch(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      role="region"
      aria-label="Tampilan Pohon Alternatif Aksesibilitas"
      className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto text-slate-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Daftar Navigasi Pohon Hierarki
          </h2>
          <p className="text-xs text-slate-400">
            Alternatif non-kanvas ramah pembaca layar (screen reader) dan keyboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="tree-filter" className="text-xs text-slate-400">
            Filter Tipe:
          </label>
          <select
            id="tree-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as NodeType | 'all')}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-sky-400 min-h-[44px]"
          >
            <option value="all">Semua Hierarki</option>
            <option value="root">Root</option>
            <option value="field">Bidang</option>
            <option value="specialization">Spesialisasi</option>
            <option value="role">Peran</option>
            <option value="skill">Skill</option>
            <option value="tool">Tool</option>
          </select>
        </div>
      </div>

      {filterType === 'all' ? (
        <ul className="space-y-2">
          {rootNodes.map((root) => renderBranch(root, 0))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredNodes.map((item) => (
            <li
              key={item.id}
              className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between"
            >
              <div>
                <button
                  type="button"
                  onClick={() => onSelectNode(item)}
                  className="text-xs font-semibold text-slate-200 hover:text-sky-400 text-left min-h-[44px] flex items-center"
                >
                  {item.label}
                </button>
                {item.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>

              {item.docsUrl && (
                <a
                  href={item.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 min-h-[44px] min-w-[44px] flex items-center justify-center rounded"
                  aria-label={`Buka docs ${item.label}`}
                >
                  ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
