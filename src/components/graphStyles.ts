import type { StylesheetStyle } from 'cytoscape';

/**
 * Cytoscape stylesheet tailored for a sleek cyber-network theme:
 * - Deterministic circular nodes with distinct colors & sizes per node type
 * - Crisp legible typography
 * - Part_of edges (solid, subtle cyan/slate)
 * - Prerequisite edges (dashed with arrows, amber/gold)
 * - Hover / Neighbor highlighting and dimming classes
 */
export const graphStyles: StylesheetStyle[] = [
  // --- Core Node Styling ---
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      color: '#f8fafc',
      'font-size': '11px',
      'font-weight': 600,
      'font-family': 'Inter, system-ui, -apple-system, sans-serif',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'text-background-color': '#020617',
      'text-background-opacity': 0.75,
      'text-background-padding': '3px',
      'text-background-shape': 'roundrectangle',
      'border-width': 2,
      'border-color': '#38bdf8',
      'background-color': '#0f172a',
      'background-opacity': 0.95,
      'transition-property':
        'background-color, border-color, border-width, opacity, text-opacity, width, height',
      'transition-duration': 0.25,
    },
  },

  // --- Node Types Specific Sizes & Colors ---
  {
    selector: 'node[type = "root"]',
    style: {
      width: 76,
      height: 76,
      'font-size': '14px',
      'font-weight': 700,
      'background-color': '#0369a1',
      'border-color': '#38bdf8',
      'border-width': 4,
      'text-margin-y': 8,
    },
  },
  {
    selector: 'node[type = "field"]',
    style: {
      width: 58,
      height: 58,
      'font-size': '12px',
      'background-color': '#1e3a8a',
      'border-color': '#60a5fa',
      'border-width': 3,
    },
  },
  {
    selector: 'node[type = "specialization"]',
    style: {
      width: 46,
      height: 46,
      'font-size': '11px',
      'background-color': '#4338ca',
      'border-color': '#818cf8',
      'border-width': 2.5,
    },
  },
  {
    selector: 'node[type = "role"]',
    style: {
      width: 42,
      height: 42,
      'font-size': '11px',
      'background-color': '#047857',
      'border-color': '#34d399',
      'border-width': 2.5,
    },
  },
  {
    selector: 'node[type = "skill"]',
    style: {
      width: 34,
      height: 34,
      'font-size': '10px',
      'background-color': '#0e7490',
      'border-color': '#22d3ee',
      'border-width': 2,
    },
  },
  {
    selector: 'node[type = "tool"]',
    style: {
      width: 32,
      height: 32,
      'font-size': '10px',
      'background-color': '#b45309',
      'border-color': '#fbbf24',
      'border-width': 2,
    },
  },

  // --- State: Node has collapsed children (indicator halo) ---
  {
    selector: 'node.has-collapsed-children',
    style: {
      'border-style': 'double',
      'border-width': 4,
    },
  },

  // --- Core Edge Styling ---
  {
    selector: 'edge',
    style: {
      width: 1.5,
      opacity: 0.65,
      'curve-style': 'bezier',
      'line-color': '#475569',
      'transition-property': 'line-color, width, opacity',
      'transition-duration': 0.25,
    },
  },

  // --- Edge: part_of (Solid, cyan-tinted) ---
  {
    selector: 'edge[kind = "part_of"]',
    style: {
      'line-style': 'solid',
      'line-color': '#38bdf8',
      width: 2,
      opacity: 0.55,
    },
  },

  // --- Edge: prerequisite (Dashed with arrow, amber) ---
  {
    selector: 'edge[kind = "prerequisite"]',
    style: {
      'line-style': 'dashed',
      'line-dash-pattern': [6, 4],
      'line-color': '#f59e0b',
      'target-arrow-color': '#f59e0b',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1.1,
      width: 2,
      opacity: 0.8,
    },
  },

  // --- Interactivity: Dimming when a node is hovered ---
  {
    selector: '.dimmed',
    style: {
      opacity: 0.15,
      'text-opacity': 0.15,
    },
  },

  // --- Interactivity: Highlighted / Active Hover ---
  {
    selector: 'node.highlighted',
    style: {
      opacity: 1,
      'text-opacity': 1,
      'border-color': '#ffffff',
      'border-width': 4,
    },
  },
  {
    selector: 'edge.highlighted',
    style: {
      opacity: 1,
      width: 3,
    },
  },

  // --- Interactivity: Selected node ---
  {
    selector: 'node.selected',
    style: {
      'border-color': '#f43f5e',
      'border-width': 4,
    },
  },

  // --- Feature: Learned node styling (emerald green halo / badge) ---
  {
    selector: 'node.learned',
    style: {
      'border-color': '#10b981',
      'border-width': 3.5,
      'background-blacken': 0.15,
    },
  },

  // --- Feature: Path highlighting from root to selected node ---
  {
    selector: 'node.path-node',
    style: {
      opacity: 1,
      'text-opacity': 1,
      'border-color': '#38bdf8',
      'border-width': 3.5,
    },
  },
  {
    selector: 'edge.path-edge',
    style: {
      opacity: 1,
      width: 4,
      'line-color': '#38bdf8',
      'target-arrow-color': '#38bdf8',
      'z-index': 999,
    },
  },
];
