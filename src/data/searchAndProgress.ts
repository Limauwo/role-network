import type { GraphNode, GraphData, NodeType, NodeCategory } from '../types/graph';

export interface FilterOptions {
  type?: NodeType | 'all';
  category?: NodeCategory | 'all';
}

/**
 * Lightweight fuzzy search on node label, id, and description.
 * Returns matches ranked by relevance score (higher score = better match).
 */
export function searchNodes(
  query: string,
  nodes: GraphNode[],
  filters?: FilterOptions
): GraphNode[] {
  const trimmed = query.trim().toLowerCase();

  // Apply type/category filters if specified
  const filtered = nodes.filter((node) => {
    if (filters?.type && filters.type !== 'all' && node.type !== filters.type) {
      return false;
    }
    if (
      filters?.category &&
      filters.category !== 'all' &&
      node.category !== filters.category
    ) {
      return false;
    }
    return true;
  });

  if (!trimmed) {
    return filtered;
  }

  interface ScoredNode {
    node: GraphNode;
    score: number;
  }

  const scored: ScoredNode[] = [];

  for (const node of filtered) {
    const labelLower = node.label.toLowerCase();
    const idLower = node.id.toLowerCase();
    const descLower = (node.description || '').toLowerCase();

    let score = -1;

    // Exact label match
    if (labelLower === trimmed || idLower === trimmed) {
      score = 100;
    }
    // Starts with query
    else if (labelLower.startsWith(trimmed) || idLower.startsWith(trimmed)) {
      score = 80;
    }
    // Substring in label
    else if (labelLower.includes(trimmed)) {
      score = 60;
    }
    // Substring in ID
    else if (idLower.includes(trimmed)) {
      score = 40;
    }
    // Substring in description
    else if (descLower.includes(trimmed)) {
      score = 20;
    } else {
      // Fuzzy character sequence matching
      const fuzzyScore = calculateFuzzyMatchScore(trimmed, labelLower);
      if (fuzzyScore > 0) {
        score = fuzzyScore;
      }
    }

    if (score > 0) {
      scored.push({ node, score });
    }
  }

  // Sort descending by score, then ascending by label
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.node.label.localeCompare(b.node.label);
  });

  return scored.map((s) => s.node);
}

function calculateFuzzyMatchScore(query: string, text: string): number {
  let qIdx = 0;
  let tIdx = 0;
  let matches = 0;

  while (qIdx < query.length && tIdx < text.length) {
    if (query[qIdx] === text[tIdx]) {
      matches++;
      qIdx++;
    }
    tIdx++;
  }

  if (qIdx === query.length) {
    // All characters of query matched in sequence
    return Math.max(1, Math.round(15 * (matches / text.length)));
  }

  return 0;
}

/**
 * Finds the shortest structural path (via 'part_of' edges) from the root node ("it")
 * to the given target node. Returns array of node IDs in breadcrumb order: [root, ..., target]
 */
export function getBreadcrumbPath(
  targetId: string,
  data: GraphData
): string[] {
  // If target is root, return [target]
  const targetNode = data.nodes.find((n) => n.id === targetId);
  if (!targetNode || targetNode.type === 'root') {
    return [targetId];
  }

  // Build incoming parent graph for 'part_of' edges
  const parentsMap = new Map<string, string[]>();
  for (const edge of data.edges) {
    if (edge.kind === 'part_of') {
      const list = parentsMap.get(edge.target) || [];
      list.push(edge.source);
      parentsMap.set(edge.target, list);
    }
  }

  // BFS backwards from target to find the root node ("it" or node.type === 'root')
  const queue: Array<{ current: string; path: string[] }> = [
    { current: targetId, path: [targetId] },
  ];
  const visited = new Set<string>([targetId]);

  let bestPath: string[] = [targetId];

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    const currentNode = data.nodes.find((n) => n.id === current);

    if (currentNode?.type === 'root') {
      bestPath = path;
      break;
    }

    const parents = parentsMap.get(current) || [];
    for (const parent of parents) {
      if (!visited.has(parent)) {
        visited.add(parent);
        queue.push({
          current: parent,
          path: [parent, ...path],
        });
      }
    }
  }

  return bestPath;
}

/**
 * Calculates learning progress for a role or collection of nodes.
 * Returns completed count, total count, and rounded percentage [0..100].
 */
export function calculateRoleProgress(
  roleTechStack: GraphNode[],
  learnedNodeIds: Set<string>
): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = roleTechStack.length;
  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  let completed = 0;
  for (const item of roleTechStack) {
    if (learnedNodeIds.has(item.id)) {
      completed++;
    }
  }

  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}
