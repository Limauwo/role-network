import type { GraphData, GraphNode, NodeCategory } from '../types/graph';

export interface GroupedTechStack {
  category: NodeCategory | 'other';
  label: string;
  items: GraphNode[];
}

export const CATEGORY_LABELS: Record<NodeCategory | 'other', string> = {
  language: 'Bahasa Pemrograman',
  framework: 'Framework & Pustaka',
  database: 'Basis Data',
  tooling: 'Tools & Perangkat',
  platform: 'Platform & Runtime',
  concept: 'Konsep & Fundamental',
  other: 'Lainnya',
};

const CATEGORY_ORDER: Array<NodeCategory | 'other'> = [
  'language',
  'framework',
  'platform',
  'database',
  'tooling',
  'concept',
  'other',
];

/**
 * Traverses the graph from a role node (or any node) to find all direct and
 * indirect skill and tool nodes connected via 'part_of' edges.
 * Handles sub-role hierarchies (e.g. Fullstack Developer -> Frontend Developer & Backend Developer).
 */
export function getTechStackForRole(
  roleNodeId: string,
  data: GraphData
): GraphNode[] {
  const nodeMap = new Map<string, GraphNode>();
  for (const node of data.nodes) {
    nodeMap.set(node.id, node);
  }

  const visited = new Set<string>();
  const queue: string[] = [roleNodeId];
  const techStackNodes: GraphNode[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    // Look for edges where current node is source and kind is 'part_of'
    for (const edge of data.edges) {
      if (edge.source === currentId && edge.kind === 'part_of') {
        const targetNode = nodeMap.get(edge.target);
        if (!targetNode) continue;

        if (targetNode.type === 'skill' || targetNode.type === 'tool') {
          if (!techStackNodes.some((item) => item.id === targetNode.id)) {
            techStackNodes.push(targetNode);
          }
        } else if (targetNode.type === 'role') {
          // If a role points to another role (like Fullstack -> Frontend & Backend)
          if (!visited.has(targetNode.id)) {
            queue.push(targetNode.id);
          }
        }
      }
    }
  }

  return techStackNodes;
}

/**
 * Groups a collection of tech stack nodes by their category with localized Indonesian labels.
 */
export function groupTechStackByCategory(
  techStack: GraphNode[]
): GroupedTechStack[] {
  const map = new Map<NodeCategory | 'other', GraphNode[]>();

  for (const item of techStack) {
    const cat: NodeCategory | 'other' = item.category || 'other';
    const list = map.get(cat) || [];
    list.push(item);
    map.set(cat, list);
  }

  const result: GroupedTechStack[] = [];
  for (const cat of CATEGORY_ORDER) {
    const items = map.get(cat);
    if (items && items.length > 0) {
      // Sort items alphabetically by label
      items.sort((a, b) => a.label.localeCompare(b.label));
      result.push({
        category: cat,
        label: CATEGORY_LABELS[cat] || cat,
        items,
      });
    }
  }

  return result;
}

/**
 * Computes suggested learning order for a set of nodes using topological sorting
 * based on 'prerequisite' edges (source -> target means source must be learned before target).
 * Also falls back to preserve nodes without prerequisite dependencies.
 */
export function computeLearningOrder(
  nodes: GraphNode[],
  data: GraphData
): GraphNode[] {
  if (nodes.length === 0) return [];

  const targetIds = new Set(nodes.map((n) => n.id));
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Build in-degree and adjacency list among the given nodes for 'prerequisite' edges
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const id of targetIds) {
    inDegree.set(id, 0);
    adj.set(id, []);
  }

  for (const edge of data.edges) {
    if (edge.kind === 'prerequisite') {
      if (targetIds.has(edge.source) && targetIds.has(edge.target)) {
        // edge.source is prerequisite of edge.target
        adj.get(edge.source)!.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    }
  }

  // Kahn's algorithm for topological sorting
  // Use a sorted queue to ensure deterministic tie-breaking by label
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }
  queue.sort((a, b) =>
    nodeMap.get(a)!.label.localeCompare(nodeMap.get(b)!.label)
  );

  const sortedResult: GraphNode[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentNode = nodeMap.get(currentId);
    if (currentNode) {
      sortedResult.push(currentNode);
    }

    const neighbors = adj.get(currentId) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
        // keep queue sorted for determinism
        queue.sort((a, b) =>
          nodeMap.get(a)!.label.localeCompare(nodeMap.get(b)!.label)
        );
      }
    }
  }

  // If there are disconnected or circular remaining nodes, append them deterministically
  if (sortedResult.length < nodes.length) {
    const placed = new Set(sortedResult.map((n) => n.id));
    const remaining = nodes
      .filter((n) => !placed.has(n.id))
      .sort((a, b) => a.label.localeCompare(b.label));
    sortedResult.push(...remaining);
  }

  return sortedResult;
}

/**
 * Finds all ancestor IDs that need to be expanded so that a target node becomes visible.
 * Traces backwards through incoming 'part_of' edges to the root(s).
 */
export function getAncestorPathToExpand(
  targetId: string,
  data: GraphData
): string[] {
  const ancestorsToExpand = new Set<string>();

  const incomingParentMap = new Map<string, string[]>();
  for (const edge of data.edges) {
    if (edge.kind === 'part_of') {
      const list = incomingParentMap.get(edge.target) || [];
      list.push(edge.source);
      incomingParentMap.set(edge.target, list);
    }
  }

  const queue = [targetId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const parents = incomingParentMap.get(current) || [];
    for (const parent of parents) {
      if (!ancestorsToExpand.has(parent)) {
        ancestorsToExpand.add(parent);
        queue.push(parent);
      }
    }
  }

  return Array.from(ancestorsToExpand);
}

/**
 * Extracts clean domain name from URL for visual badges (e.g., "react.dev" or "developer.mozilla.org").
 */
export function extractDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
