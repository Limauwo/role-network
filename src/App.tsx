import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { loadGraphData } from './data/loadGraph';
import { NetworkGraph } from './components/NetworkGraph';
import { DetailPanel } from './components/DetailPanel';
import { SearchBar } from './components/SearchBar';
import { AccessibleTreeView } from './components/AccessibleTreeView';
import { AboutModal } from './components/AboutModal';
import { useGraphState } from './state/graphState';
import { useProgress } from './state/useProgress';
import { getAncestorPathToExpand } from './data/traversal';
import { getBreadcrumbPath } from './data/searchAndProgress';
import type { GraphNode } from './types/graph';

export const App: React.FC = () => {
  const graphData = useMemo(() => loadGraphData(), []);
  const graphState = useGraphState(graphData);
  const { expandNodes, setSelected } = graphState;

  const { learnedNodeIds, toggleLearned, resetProgress } = useProgress();

  const [selectedNode, setSelectedNodeState] = useState<GraphNode | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'tree'>('graph');
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Map nodes for fast lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const node of graphData.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [graphData.nodes]);

  // Synchronize selection changes to state, hash, and Cytoscape highlight
  const handleSelectNode = useCallback(
    (node: GraphNode | null) => {
      setSelectedNodeState(node);
      setSelected(node ? node.id : null);

      if (node) {
        // Expand ancestor path if needed so node is visible
        const ancestors = getAncestorPathToExpand(node.id, graphData);
        if (ancestors.length > 0) {
          expandNodes(ancestors);
        }

        // Update URL hash without reload
        const hash = `#/node/${node.id}`;
        if (window.location.hash !== hash) {
          window.history.pushState(null, '', hash);
        }
      } else {
        if (window.location.hash && window.location.hash !== '#/') {
          window.history.pushState(null, '', window.location.pathname);
        }
      }
    },
    [setSelected, expandNodes, graphData]
  );

  // Path from root to selected node for highlight & breadcrumb
  const pathToHighlight = useMemo(() => {
    if (!selectedNode) return [];
    return getBreadcrumbPath(selectedNode.id, graphData);
  }, [selectedNode, graphData]);

  // Handle URL hash on initial load and popstate
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash) {
        setSelectedNodeState(null);
        setSelected(null);
        return;
      }

      // Supports #/role/frontend-developer or #/node/frontend-developer
      const match = hash.match(/^#\/(?:role|node)\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const nodeId = match[1];
        const targetNode = nodeMap.get(nodeId);
        if (targetNode) {
          const ancestors = getAncestorPathToExpand(targetNode.id, graphData);
          if (ancestors.length > 0) {
            expandNodes(ancestors);
          }
          setSelectedNodeState(targetNode);
          setSelected(targetNode.id);
        }
      }
    };

    handleHashChange();
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [nodeMap, graphData, expandNodes, setSelected]);

  // Handle Escape key to close panel & modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAboutOpen) {
          setIsAboutOpen(false);
        } else if (selectedNode) {
          handleSelectNode(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, isAboutOpen, handleSelectNode]);

  // Check if detail panel should open
  const isDetailPanelOpen = selectedNode !== null;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 font-sans text-slate-100">
      {/* Top Navbar Header */}
      <header className="h-14 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-3 bg-slate-900/70 backdrop-blur-md z-20">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8]"></div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Role Network
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-none">
              Peta Karier IT Interaktif
            </p>
          </div>
        </div>

        {/* Global Search Bar with Shortcut '/' and Filters */}
        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <SearchBar
            nodes={graphData.nodes}
            onSelectNode={handleSelectNode}
          />
        </div>

        {/* View Mode Switcher, About, & Progress Counter */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-xs text-slate-400">
          {/* View Toggle (Graph vs Accessible Tree) */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition min-h-[44px] flex items-center ${
                viewMode === 'graph'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Tampilan Kanvas Graf"
            >
              Graf
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition min-h-[44px] flex items-center ${
                viewMode === 'tree'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Tampilan Pohon Daftar Aksesibel"
            >
              Pohon
            </button>
          </div>

          {/* About / Contribute Button */}
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-md text-slate-300 font-medium transition min-h-[44px] flex items-center"
            title="Tentang Proyek & Berkontribusi"
            aria-label="Informasi Tentang Proyek dan Panduan Kontribusi"
          >
            Tentang
          </button>

          {/* Progress Tracker Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/80 border border-slate-700/60 min-h-[44px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300 font-medium hidden xs:inline">
              {learnedNodeIds.size} Pelajari
            </span>
          </div>
        </div>
      </header>

      {/* Main Graph Canvas Area vs Accessible Tree View Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {viewMode === 'graph' ? (
          <NetworkGraph
            data={graphData}
            selectedNodeId={selectedNode ? selectedNode.id : null}
            learnedNodeIds={learnedNodeIds}
            pathToHighlight={pathToHighlight}
            onSelectNode={handleSelectNode}
            graphState={graphState}
          />
        ) : (
          <div className="w-full h-full overflow-y-auto bg-slate-950">
            <AccessibleTreeView
              data={graphData}
              learnedNodeIds={learnedNodeIds}
              onSelectNode={handleSelectNode}
              onToggleLearned={toggleLearned}
            />
          </div>
        )}

        {/* Responsive Detail Panel / Bottom Sheet */}
        {isDetailPanelOpen && (
          <DetailPanel
            node={selectedNode}
            data={graphData}
            breadcrumb={pathToHighlight}
            learnedNodeIds={learnedNodeIds}
            onToggleLearned={toggleLearned}
            onResetProgress={resetProgress}
            onClose={() => handleSelectNode(null)}
            onSelectNode={handleSelectNode}
          />
        )}

        {/* About & Contribution Modal Dialog */}
        <AboutModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
        />
      </main>
    </div>
  );
};

export default App;
