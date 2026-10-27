import React, { useEffect, useRef, useMemo } from 'react';
import cytoscape, {
  Core as CyCore,
  NodeSingular,
  EventObject,
} from 'cytoscape';
import type { GraphData, GraphNode } from '../types/graph';
import { useGraphState } from '../state/graphState';
import { graphStyles } from './graphStyles';
import { computeDeterministicLayout } from './layoutCalculator';

interface NetworkGraphProps {
  data: GraphData;
  selectedNodeId?: string | null;
  learnedNodeIds?: Set<string>;
  pathToHighlight?: string[]; // Node IDs from root to selected [root, ..., target]
  onSelectNode?: (node: GraphNode | null) => void;
  graphState?: ReturnType<typeof useGraphState>;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  selectedNodeId = null,
  learnedNodeIds,
  pathToHighlight = [],
  onSelectNode,
  graphState: externalGraphState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<CyCore | null>(null);

  const internalGraphState = useGraphState(data);
  const {
    state,
    visibleGraph,
    toggleExpand,
    expandAll,
    resetView,
    setHovered,
    setSelected,
  } = externalGraphState || internalGraphState;

  const visibleNodeIds = useMemo(() => {
    return new Set(visibleGraph.visibleNodes.map((n) => n.id));
  }, [visibleGraph.visibleNodes]);

  // Compute deterministic coordinates for all visible nodes
  const layoutPositions = useMemo(() => {
    return computeDeterministicLayout(data.nodes, data.edges, visibleNodeIds);
  }, [data.nodes, data.edges, visibleNodeIds]);

  // Keep callback refs fresh for Cytoscape event listeners
  const callbacksRef = useRef({
    toggleExpand,
    setHovered,
    setSelected,
    onSelectNode,
    nodesMap: new Map<string, GraphNode>(),
    hasChildrenMap: visibleGraph.hasChildrenMap,
    expandedNodeIds: state.expandedNodeIds,
  });

  useEffect(() => {
    const nodesMap = new Map<string, GraphNode>();
    for (const node of data.nodes) {
      nodesMap.set(node.id, node);
    }
    callbacksRef.current = {
      toggleExpand,
      setHovered,
      setSelected,
      onSelectNode,
      nodesMap,
      hasChildrenMap: visibleGraph.hasChildrenMap,
      expandedNodeIds: state.expandedNodeIds,
    };
  }, [
    toggleExpand,
    setHovered,
    setSelected,
    onSelectNode,
    data.nodes,
    visibleGraph.hasChildrenMap,
    state.expandedNodeIds,
  ]);

  // 1. Initialize Cytoscape Instance (Thin wrapper with cleanup)
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: graphStyles,
      boxSelectionEnabled: false,
      autounselectify: false,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      minZoom: 0.25,
      maxZoom: 3.0,
      wheelSensitivity: 0.3,
    });

    cyRef.current = cy;

    // Click on node: toggle expand/collapse if has children, select node
    cy.on('tap', 'node', (evt: EventObject) => {
      const target = evt.target as NodeSingular;
      const nodeId = target.id();
      const nodeData = callbacksRef.current.nodesMap.get(nodeId) || null;

      callbacksRef.current.setSelected(nodeId);
      if (callbacksRef.current.onSelectNode) {
        callbacksRef.current.onSelectNode(nodeData);
      }

      if (callbacksRef.current.hasChildrenMap.get(nodeId)) {
        callbacksRef.current.toggleExpand(nodeId);
      }
    });

    // Click on canvas background: deselect
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        callbacksRef.current.setSelected(null);
        if (callbacksRef.current.onSelectNode) {
          callbacksRef.current.onSelectNode(null);
        }
      }
    });

    // Mouse over: hover highlight neighbor network
    cy.on('mouseover', 'node', (evt: EventObject) => {
      const target = evt.target as NodeSingular;
      callbacksRef.current.setHovered(target.id());
    });

    // Mouse out: clear hover highlight
    cy.on('mouseout', 'node', () => {
      callbacksRef.current.setHovered(null);
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // 2. Sync Elements, Deterministic Layout, and Smooth Fit
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      const existingElements = cy.elements();
      const nextNodeIds = new Set(visibleGraph.visibleNodes.map((n) => n.id));
      const nextEdgeKeys = new Set(
        visibleGraph.visibleEdges.map((e) => `${e.source}->${e.target}:${e.kind}`)
      );

      // Remove obsolete nodes/edges
      existingElements.forEach((el) => {
        if (el.isNode()) {
          if (!nextNodeIds.has(el.id())) {
            cy.remove(el);
          }
        } else if (el.isEdge()) {
          const key = `${el.data('source')}->${el.data('target')}:${el.data('kind')}`;
          if (!nextEdgeKeys.has(key)) {
            cy.remove(el);
          }
        }
      });

      // Add or update nodes with deterministic positions
      visibleGraph.visibleNodes.forEach((node) => {
        const pos = layoutPositions.get(node.id) || { x: 0, y: 0 };
        const hasChildren = visibleGraph.hasChildrenMap.get(node.id) || false;
        const isExpanded = state.expandedNodeIds.has(node.id);

        let cyNode = cy.getElementById(node.id);
        if (cyNode.length === 0) {
          // Add new node positioned smoothly
          cyNode = cy.add({
            group: 'nodes',
            data: {
              id: node.id,
              label: node.label,
              type: node.type,
              category: node.category,
              description: node.description,
            },
            position: { ...pos },
          });
        } else {
          // Update data & animate to new target position if changed
          cyNode.data({
            label: node.label,
            type: node.type,
            category: node.category,
            description: node.description,
          });
          const currPos = cyNode.position();
          if (currPos.x !== pos.x || currPos.y !== pos.y) {
            cyNode.animate({
              position: pos,
              duration: 350,
              easing: 'ease-in-out-cubic',
            });
          }
        }

        // Toggle visual halo class indicating expandable/collapsible state
        if (hasChildren && !isExpanded) {
          cyNode.addClass('has-collapsed-children');
        } else {
          cyNode.removeClass('has-collapsed-children');
        }
      });

      // Add new edges
      visibleGraph.visibleEdges.forEach((edge) => {
        const edgeId = `e_${edge.source}_${edge.target}_${edge.kind}`;
        const existing = cy.getElementById(edgeId);
        if (existing.length === 0) {
          cy.add({
            group: 'edges',
            data: {
              id: edgeId,
              source: edge.source,
              target: edge.target,
              kind: edge.kind,
            },
          });
        }
      });
    });

    // Smooth camera fit without jarring jump
    cy.animate({
      fit: {
        eles: cy.elements(),
        padding: 50,
      },
      duration: 400,
      easing: 'ease-in-out-cubic',
    });
  }, [visibleGraph, layoutPositions, state.expandedNodeIds]);

  // 3. Sync Hover Dimming, Path Highlighting, and Selection
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      const all = cy.elements();

      // Reset dynamic interactive classes
      all.removeClass('dimmed highlighted path-node path-edge selected');

      // 1. Path highlighting: when a node is selected, highlight path from root to node
      const hasActivePath = pathToHighlight.length > 0;
      if (hasActivePath) {
        const pathNodeSet = new Set<string>(pathToHighlight);
        const pathNodes = cy.nodes().filter((n: NodeSingular) => pathNodeSet.has(n.id()));
        pathNodes.addClass('path-node');

        // Highlight connecting part_of edges along the path
        for (let i = 0; i < pathToHighlight.length - 1; i++) {
          const u = pathToHighlight[i];
          const v = pathToHighlight[i + 1];
          const edge = cy.edges(`[source = "${u}"][target = "${v}"][kind = "part_of"]`);
          edge.addClass('path-edge');
        }

        // Dim everything else not on the path (unless hovered)
        if (!state.hoveredNodeId) {
          all.not('.path-node, .path-edge').addClass('dimmed');
        }
      }

      // 2. Hover highlight (takes precedence for neighborhood exploration)
      if (state.hoveredNodeId) {
        const hoveredNode = cy.getElementById(state.hoveredNodeId);
        if (hoveredNode.length > 0) {
          const neighborhood = hoveredNode.closedNeighborhood();
          all.difference(neighborhood).addClass('dimmed').removeClass('highlighted');
          neighborhood.removeClass('dimmed').addClass('highlighted');
        }
      }

      // 3. Sync selected class
      const activeSelectedId =
        selectedNodeId !== undefined ? selectedNodeId : state.selectedNodeId;
      if (activeSelectedId) {
        const targetNode = cy.getElementById(activeSelectedId);
        targetNode.addClass('selected');
      }

      // 4. Sync learned class for progress tracking
      if (learnedNodeIds) {
        cy.nodes().forEach((n) => {
          if (learnedNodeIds.has(n.id())) {
            n.addClass('learned');
          } else {
            n.removeClass('learned');
          }
        });
      }
    });
  }, [
    state.hoveredNodeId,
    state.selectedNodeId,
    selectedNodeId,
    pathToHighlight,
    learnedNodeIds,
  ]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 select-none">
      {/* Top Action Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1.5 rounded-lg shadow-lg">
        <button
          type="button"
          onClick={resetView}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          title="Kembalikan ke tampilan awal (IT & Bidang)"
        >
          Reset Tampilan
        </button>
        <button
          type="button"
          onClick={expandAll}
          className="px-3 py-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded transition"
          title="Buka semua cabang"
        >
          Buka Semua
        </button>
        <span className="text-slate-700">|</span>
        <button
          type="button"
          onClick={() => {
            if (cyRef.current) {
              cyRef.current.animate({
                fit: { eles: cyRef.current.elements(), padding: 50 },
                duration: 350,
              });
            }
          }}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          title="Pusatkan graf"
        >
          Pusatkan
        </button>
      </div>

      {/* Legend & Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/85 backdrop-blur-md border border-slate-800 p-3 rounded-lg text-xs space-y-2 shadow-lg max-w-xs">
        <p className="font-semibold text-slate-200">Panduan Interaksi</p>
        <p className="text-slate-400 leading-relaxed">
          Klik node untuk expand/collapse anak cabang. Scroll untuk zoom, drag
          untuk pan. Hover untuk menyorot jalur relasi.
        </p>
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-400/40"></span>
            <span>Root / IT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-400/40"></span>
            <span>Bidang</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-400/40"></span>
            <span>Spesialisasi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-400/40"></span>
            <span>Peran</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 ring-2 ring-cyan-400/40"></span>
            <span>Skill</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 ring-2 ring-amber-400/40"></span>
            <span>Tool</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-sky-400 inline-block"></span> part_of
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 border-b border-dashed border-amber-400 inline-block"></span>{' '}
            prerequisite
          </span>
        </div>
      </div>

      {/* Cytoscape Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
