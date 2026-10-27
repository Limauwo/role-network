import { useReducer, useMemo, useCallback } from 'react';
import type { GraphData, GraphNode, GraphEdge } from '../types/graph';

export interface GraphState {
  // Set of node IDs that are expanded
  expandedNodeIds: Set<string>;
  // Currently hovered node ID for highlighting
  hoveredNodeId: string | null;
  // Currently selected node ID for details/inspector
  selectedNodeId: string | null;
}

export type GraphAction =
  | { type: 'TOGGLE_EXPAND'; nodeId: string }
  | { type: 'EXPAND_NODE'; nodeId: string }
  | { type: 'EXPAND_NODES'; nodeIds: string[] }
  | { type: 'COLLAPSE_NODE'; nodeId: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'RESET_VIEW' }
  | { type: 'SET_HOVERED'; nodeId: string | null }
  | { type: 'SET_SELECTED'; nodeId: string | null };

/**
 * Initial state has the root and field level expanded,
 * matching progressive disclosure requirements:
 * "Awal: hanya tampil node IT + node level 'field'"
 */
export function createInitialGraphState(data: GraphData): GraphState {
  const initialExpanded = new Set<string>();

  // Find root node(s) and expand them so field nodes are initially visible
  for (const node of data.nodes) {
    if (node.type === 'root') {
      initialExpanded.add(node.id);
    }
  }

  return {
    expandedNodeIds: initialExpanded,
    hoveredNodeId: null,
    selectedNodeId: null,
  };
}

export function graphReducer(
  state: GraphState,
  action: GraphAction,
  data: GraphData
): GraphState {
  switch (action.type) {
    case 'TOGGLE_EXPAND': {
      const nextExpanded = new Set(state.expandedNodeIds);
      if (nextExpanded.has(action.nodeId)) {
        // Collapsing: recursively collapse all descendents in 'part_of' tree
        const toCollapse = getDescendantNodeIds(action.nodeId, data);
        toCollapse.add(action.nodeId);
        for (const id of toCollapse) {
          nextExpanded.delete(id);
        }
      } else {
        nextExpanded.add(action.nodeId);
      }
      return {
        ...state,
        expandedNodeIds: nextExpanded,
      };
    }

    case 'EXPAND_NODE': {
      if (state.expandedNodeIds.has(action.nodeId)) return state;
      const nextExpanded = new Set(state.expandedNodeIds);
      nextExpanded.add(action.nodeId);
      return {
        ...state,
        expandedNodeIds: nextExpanded,
      };
    }

    case 'EXPAND_NODES': {
      const nextExpanded = new Set(state.expandedNodeIds);
      let changed = false;
      for (const id of action.nodeIds) {
        if (!nextExpanded.has(id)) {
          nextExpanded.add(id);
          changed = true;
        }
      }
      if (!changed) return state;
      return {
        ...state,
        expandedNodeIds: nextExpanded,
      };
    }

    case 'COLLAPSE_NODE': {
      if (!state.expandedNodeIds.has(action.nodeId)) return state;
      const nextExpanded = new Set(state.expandedNodeIds);
      const toCollapse = getDescendantNodeIds(action.nodeId, data);
      toCollapse.add(action.nodeId);
      for (const id of toCollapse) {
        nextExpanded.delete(id);
      }
      return {
        ...state,
        expandedNodeIds: nextExpanded,
      };
    }

    case 'EXPAND_ALL': {
      const allExpandable = new Set<string>();
      for (const node of data.nodes) {
        // Check if node has children in part_of
        const hasChildren = data.edges.some(
          (e) => e.source === node.id && e.kind === 'part_of'
        );
        if (hasChildren) {
          allExpandable.add(node.id);
        }
      }
      return {
        ...state,
        expandedNodeIds: allExpandable,
      };
    }

    case 'RESET_VIEW': {
      return createInitialGraphState(data);
    }

    case 'SET_HOVERED': {
      if (state.hoveredNodeId === action.nodeId) return state;
      return {
        ...state,
        hoveredNodeId: action.nodeId,
      };
    }

    case 'SET_SELECTED': {
      if (state.selectedNodeId === action.nodeId) return state;
      return {
        ...state,
        selectedNodeId: action.nodeId,
      };
    }

    default:
      return state;
  }
}

/**
 * Returns set of descendant node IDs connected via 'part_of' hierarchy
 */
function getDescendantNodeIds(rootId: string, data: GraphData): Set<string> {
  const descendants = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of data.edges) {
      if (edge.source === current && edge.kind === 'part_of') {
        if (!descendants.has(edge.target)) {
          descendants.add(edge.target);
          queue.push(edge.target);
        }
      }
    }
  }

  return descendants;
}

/**
 * Computes which nodes and edges should be visible based on expandedNodeIds.
 * Rules:
 * 1. Root nodes are always visible.
 * 2. If a node is visible and expanded, all its children via 'part_of' become visible.
 * 3. An edge is visible if and only if both its source and target are visible.
 */
export function computeVisibleGraph(
  data: GraphData,
  expandedNodeIds: Set<string>
): {
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
  hasChildrenMap: Map<string, boolean>;
  depthMap: Map<string, number>;
} {
  const visibleNodeIds = new Set<string>();
  const depthMap = new Map<string, number>();

  // Identify root nodes (depth 0)
  for (const node of data.nodes) {
    if (node.type === 'root') {
      visibleNodeIds.add(node.id);
      depthMap.set(node.id, 0);
    }
  }

  // Map out children for each node (for fast lookup)
  const childrenMap = new Map<string, string[]>();
  for (const edge of data.edges) {
    if (edge.kind === 'part_of') {
      const list = childrenMap.get(edge.source) || [];
      list.push(edge.target);
      childrenMap.set(edge.source, list);
    }
  }

  // Map boolean: does this node have any part_of children?
  const hasChildrenMap = new Map<string, boolean>();
  for (const node of data.nodes) {
    hasChildrenMap.set(node.id, (childrenMap.get(node.id)?.length || 0) > 0);
  }

  // BFS outward from roots: if a node is visible AND expanded, its children become visible
  const queue: Array<{ id: string; depth: number }> = [];
  for (const rootId of visibleNodeIds) {
    queue.push({ id: rootId, depth: 0 });
  }

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (expandedNodeIds.has(id)) {
      const children = childrenMap.get(id) || [];
      for (const childId of children) {
        if (!visibleNodeIds.has(childId)) {
          visibleNodeIds.add(childId);
          depthMap.set(childId, depth + 1);
          queue.push({ id: childId, depth: depth + 1 });
        }
      }
    }
  }

  const visibleNodes = data.nodes.filter((n) => visibleNodeIds.has(n.id));

  // Edges are visible only when both ends are visible
  const visibleEdges = data.edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  return {
    visibleNodes,
    visibleEdges,
    hasChildrenMap,
    depthMap,
  };
}

export function useGraphState(data: GraphData) {
  const [state, dispatch] = useReducer(
    (s: GraphState, a: GraphAction) => graphReducer(s, a, data),
    data,
    createInitialGraphState
  );

  const toggleExpand = useCallback((nodeId: string) => {
    dispatch({ type: 'TOGGLE_EXPAND', nodeId });
  }, []);

  const expandNode = useCallback((nodeId: string) => {
    dispatch({ type: 'EXPAND_NODE', nodeId });
  }, []);

  const expandNodes = useCallback((nodeIds: string[]) => {
    dispatch({ type: 'EXPAND_NODES', nodeIds });
  }, []);

  const collapseNode = useCallback((nodeId: string) => {
    dispatch({ type: 'COLLAPSE_NODE', nodeId });
  }, []);

  const expandAll = useCallback(() => {
    dispatch({ type: 'EXPAND_ALL' });
  }, []);

  const resetView = useCallback(() => {
    dispatch({ type: 'RESET_VIEW' });
  }, []);

  const setHovered = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SET_HOVERED', nodeId });
  }, []);

  const setSelected = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SET_SELECTED', nodeId });
  }, []);

  const visibleGraph = useMemo(() => {
    return computeVisibleGraph(data, state.expandedNodeIds);
  }, [data, state.expandedNodeIds]);

  return {
    state,
    visibleGraph,
    toggleExpand,
    expandNode,
    expandNodes,
    collapseNode,
    expandAll,
    resetView,
    setHovered,
    setSelected,
  };
}
