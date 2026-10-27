import type { GraphNode, GraphEdge, NodeType } from '../types/graph';

export interface Position {
  x: number;
  y: number;
}

/**
 * Node type radius hierarchy from center:
 * root: 0
 * field: 160
 * specialization: 320
 * role: 480
 * skill / tool: 640
 */
const TYPE_RADIUS: Record<NodeType, number> = {
  root: 0,
  field: 160,
  specialization: 320,
  role: 480,
  skill: 640,
  tool: 640,
};

/**
 * Deterministically computes node positions based on radial / concentric hierarchy.
 *
 * Requirements:
 * 1. Root node "IT" in the center (0, 0).
 * 2. Deterministic layout: same position every reload.
 * 3. Stable positioning: when expanding/collapsing nodes, existing visible nodes
 *    maintain their stable radial angles and positions, avoiding the "hairball"
 *    and avoiding full-graph random scrambling.
 */
export function computeDeterministicLayout(
  allNodes: GraphNode[],
  allEdges: GraphEdge[],
  visibleNodeIds: Set<string>
): Map<string, Position> {
  const positions = new Map<string, Position>();

  // Find root
  const rootNode = allNodes.find((n) => n.type === 'root') || allNodes[0];
  if (!rootNode) return positions;

  positions.set(rootNode.id, { x: 0, y: 0 });

  // Map parent -> children in 'part_of' tree (sorted for deterministic angle ordering)
  const childrenMap = new Map<string, string[]>();
  for (const edge of allEdges) {
    if (edge.kind === 'part_of') {
      const list = childrenMap.get(edge.source) || [];
      list.push(edge.target);
      childrenMap.set(edge.source, list);
    }
  }

  // Ensure deterministic sort for child nodes
  for (const [parent, kids] of childrenMap.entries()) {
    kids.sort();
    childrenMap.set(parent, kids);
  }

  // Pre-calculate full angular sectors for every node in the tree
  // Root distributes full circle [0, 2*PI] equally to its children
  const sectorMap = new Map<string, { startAngle: number; endAngle: number }>();
  sectorMap.set(rootNode.id, { startAngle: 0, endAngle: Math.PI * 2 });

  const queue = [rootNode.id];

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const parentSector = sectorMap.get(parentId)!;
    const children = childrenMap.get(parentId) || [];

    if (children.length === 0) continue;

    const sectorSpan = parentSector.endAngle - parentSector.startAngle;
    const sliceAngle = sectorSpan / children.length;

    children.forEach((childId, index) => {
      // If a child has multiple parents (e.g., git, js), assign sector on first encounter
      if (!sectorMap.has(childId)) {
        const start = parentSector.startAngle + index * sliceAngle;
        const end = start + sliceAngle;
        sectorMap.set(childId, { startAngle: start, endAngle: end });
        queue.push(childId);
      }
    });
  }

  // Calculate coordinates for all visible nodes
  for (const node of allNodes) {
    if (!visibleNodeIds.has(node.id)) continue;
    if (node.id === rootNode.id) continue;

    const sector = sectorMap.get(node.id);
    const radius = TYPE_RADIUS[node.type] ?? 400;

    if (sector) {
      const midAngle = (sector.startAngle + sector.endAngle) / 2;
      positions.set(node.id, {
        x: Math.round(radius * Math.cos(midAngle)),
        y: Math.round(radius * Math.sin(midAngle)),
      });
    } else {
      // Fallback for isolated nodes if any
      positions.set(node.id, {
        x: Math.round(radius * Math.cos(0)),
        y: Math.round(radius * Math.sin(0)),
      });
    }
  }

  return positions;
}
