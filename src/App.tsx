import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { loadGraphData } from './data/loadGraph';
import { NetworkGraph } from './components/NetworkGraph';
import { DetailPanel } from './components/DetailPanel';
import { useGraphState } from './state/graphState';
import { getAncestorPathToExpand } from './data/traversal';
import type { GraphNode } from './types/graph';

export const App: React.FC = () => {
  const graphData = useMemo(() => loadGraphData(), []);
  const graphState = useGraphState(graphData);
  const { expandNodes, setSelected } = graphState;

  const [selectedNode, setSelectedNodeState] = useState<GraphNode | null>(null);

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

  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        handleSelectNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, handleSelectNode]);

  // Check if detail panel should open (for role, skill, tool, or any selected node)
  const isDetailPanelOpen = selectedNode !== null;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 font-sans text-slate-100">
      {/* Top Navbar Header */}
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/70 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8]"></div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              Role Network
            </h1>
            <p className="text-[11px] text-slate-400 leading-none">
              Peta Karier IT Interaktif
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Graf Aktif</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            Fase 3 / 5
          </div>
        </div>
      </header>

      {/* Main Graph Canvas Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <NetworkGraph
          data={graphData}
          selectedNodeId={selectedNode ? selectedNode.id : null}
          onSelectNode={handleSelectNode}
          graphState={graphState}
        />

        {/* Responsive Detail Panel / Bottom Sheet */}
        {isDetailPanelOpen && (
          <DetailPanel
            node={selectedNode}
            data={graphData}
            onClose={() => handleSelectNode(null)}
            onSelectNode={handleSelectNode}
          />
        )}
      </main>
    </div>
  );
};

export default App;
