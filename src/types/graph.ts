export type NodeType =
  | 'root'
  | 'field'
  | 'specialization'
  | 'role'
  | 'skill'
  | 'tool';

export type NodeCategory =
  | 'language'
  | 'framework'
  | 'database'
  | 'tooling'
  | 'platform'
  | 'concept';

export interface GraphNode {
  id: string; // Slug unik
  label: string;
  type: NodeType;
  description?: string;
  docsUrl?: string; // Wajib untuk type 'skill' | 'tool'
  category?: NodeCategory;
}

export type EdgeKind = 'part_of' | 'prerequisite';

export interface GraphEdge {
  source: string;
  target: string;
  kind: EdgeKind;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ValidationError {
  type:
    | 'DUPLICATE_ID'
    | 'INVALID_EDGE_NODE'
    | 'ORPHAN_NODE'
    | 'MISSING_DOCS_URL'
    | 'INVALID_DOCS_URL_PROTOCOL';
  message: string;
  details?: Record<string, unknown>;
}
