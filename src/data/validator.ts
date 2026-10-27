import type { GraphData, ValidationError } from '../types/graph';

/**
 * Validates the consistency and structural integrity of GraphData:
 * 1. Duplicate IDs
 * 2. Edges pointing to non-existent nodes
 * 3. Orphan nodes (nodes without incoming part_of edge, except root)
 * 4. Missing docsUrl for skill and tool nodes
 * 5. docsUrl not using https protocol
 */
export function validateGraphData(data: GraphData): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeMap = new Map<string, (typeof data.nodes)[number]>();

  // 1. Check duplicate IDs
  for (const node of data.nodes) {
    if (nodeMap.has(node.id)) {
      errors.push({
        type: 'DUPLICATE_ID',
        message: `Duplicate node ID detected: "${node.id}".`,
        details: { nodeId: node.id },
      });
    } else {
      nodeMap.set(node.id, node);
    }
  }

  // 2. Check edges pointing to valid nodes & track incoming edges
  const incomingParentEdges = new Set<string>();

  for (const edge of data.edges) {
    const hasSource = nodeMap.has(edge.source);
    const hasTarget = nodeMap.has(edge.target);

    if (!hasSource || !hasTarget) {
      errors.push({
        type: 'INVALID_EDGE_NODE',
        message: `Edge points to non-existent node: source="${edge.source}" (${hasSource ? 'exists' : 'MISSING'}), target="${edge.target}" (${hasTarget ? 'exists' : 'MISSING'}).`,
        details: { source: edge.source, target: edge.target, kind: edge.kind },
      });
    }

    if (edge.kind === 'part_of') {
      incomingParentEdges.add(edge.target);
    }
  }

  // 3. Check orphan nodes (nodes without parent hierarchy, except 'root')
  for (const node of data.nodes) {
    if (node.type !== 'root' && !incomingParentEdges.has(node.id)) {
      errors.push({
        type: 'ORPHAN_NODE',
        message: `Orphan node detected: "${node.id}" has no parent incoming "part_of" edge and is not a root node.`,
        details: { nodeId: node.id, type: node.type },
      });
    }
  }

  // 4 & 5. Check docsUrl for skill & tool + ensure HTTPS protocol
  for (const node of data.nodes) {
    const requiresDocs = node.type === 'skill' || node.type === 'tool';

    if (requiresDocs) {
      if (!node.docsUrl || node.docsUrl.trim() === '') {
        errors.push({
          type: 'MISSING_DOCS_URL',
          message: `Node "${node.id}" of type "${node.type}" is missing required field docsUrl.`,
          details: { nodeId: node.id, type: node.type },
        });
        continue;
      }
    }

    if (node.docsUrl) {
      try {
        const parsed = new URL(node.docsUrl);
        if (parsed.protocol !== 'https:') {
          errors.push({
            type: 'INVALID_DOCS_URL_PROTOCOL',
            message: `Node "${node.id}" has docsUrl "${node.docsUrl}" which does not use HTTPS.`,
            details: { nodeId: node.id, docsUrl: node.docsUrl },
          });
        }
      } catch {
        errors.push({
          type: 'INVALID_DOCS_URL_PROTOCOL',
          message: `Node "${node.id}" has an invalid URL in docsUrl: "${node.docsUrl}".`,
          details: { nodeId: node.id, docsUrl: node.docsUrl },
        });
      }
    }
  }

  return errors;
}
