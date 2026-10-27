import { describe, it, expect } from 'vitest';
import {
  searchNodes,
  getBreadcrumbPath,
  calculateRoleProgress,
} from './searchAndProgress';
import type { GraphNode, GraphData } from '../types/graph';

const testNodes: GraphNode[] = [
  { id: 'it', label: 'Teknologi Informasi (IT)', type: 'root' },
  { id: 'web-dev', label: 'Web Development', type: 'field' },
  { id: 'frontend', label: 'Frontend', type: 'specialization' },
  { id: 'frontend-developer', label: 'Frontend Developer', type: 'role' },
  {
    id: 'javascript',
    label: 'JavaScript',
    type: 'skill',
    category: 'language',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    type: 'skill',
    category: 'language',
    docsUrl: 'https://www.typescriptlang.org/docs/',
  },
  {
    id: 'react',
    label: 'React',
    type: 'skill',
    category: 'framework',
    docsUrl: 'https://react.dev/',
  },
  {
    id: 'git',
    label: 'Git',
    type: 'tool',
    category: 'tooling',
    docsUrl: 'https://git-scm.com/doc',
  },
];

const testData: GraphData = {
  nodes: testNodes,
  edges: [
    { source: 'it', target: 'web-dev', kind: 'part_of' },
    { source: 'web-dev', target: 'frontend', kind: 'part_of' },
    { source: 'frontend', target: 'frontend-developer', kind: 'part_of' },
    { source: 'frontend-developer', target: 'javascript', kind: 'part_of' },
    { source: 'frontend-developer', target: 'typescript', kind: 'part_of' },
    { source: 'frontend-developer', target: 'react', kind: 'part_of' },
    { source: 'frontend-developer', target: 'git', kind: 'part_of' },
  ],
};

describe('searchNodes', () => {
  it('returns all nodes when query is empty', () => {
    const results = searchNodes('', testNodes);
    expect(results.length).toBe(testNodes.length);
  });

  it('performs exact and substring matching with high rank', () => {
    const results = searchNodes('react', testNodes);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('react');
  });

  it('performs lightweight fuzzy matching on character sequences', () => {
    const results = searchNodes('js', testNodes);
    const ids = results.map((r) => r.id);
    expect(ids).toContain('javascript');
  });

  it('filters results by node type', () => {
    const results = searchNodes('', testNodes, { type: 'role' });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('frontend-developer');
  });

  it('filters results by category', () => {
    const results = searchNodes('', testNodes, { category: 'language' });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('javascript');
    expect(ids).toContain('typescript');
    expect(ids).not.toContain('react');
  });
});

describe('getBreadcrumbPath', () => {
  it('finds path from root IT to Frontend Developer', () => {
    const path = getBreadcrumbPath('frontend-developer', testData);
    expect(path).toEqual(['it', 'web-dev', 'frontend', 'frontend-developer']);
  });

  it('finds path from root IT to a deep skill node', () => {
    const path = getBreadcrumbPath('react', testData);
    expect(path).toEqual([
      'it',
      'web-dev',
      'frontend',
      'frontend-developer',
      'react',
    ]);
  });

  it('handles root node itself', () => {
    const path = getBreadcrumbPath('it', testData);
    expect(path).toEqual(['it']);
  });
});

describe('calculateRoleProgress', () => {
  it('calculates 0% when none are learned', () => {
    const roleStack = testNodes.filter(
      (n) => n.type === 'skill' || n.type === 'tool'
    );
    const learned = new Set<string>();
    const res = calculateRoleProgress(roleStack, learned);
    expect(res).toEqual({ completed: 0, total: 4, percentage: 0 });
  });

  it('calculates accurate percentage when some are learned', () => {
    const roleStack = testNodes.filter(
      (n) => n.type === 'skill' || n.type === 'tool'
    );
    const learned = new Set<string>(['javascript', 'react']);
    const res = calculateRoleProgress(roleStack, learned);
    expect(res.completed).toBe(2);
    expect(res.total).toBe(4);
    expect(res.percentage).toBe(50);
  });

  it('handles empty stack safely', () => {
    const res = calculateRoleProgress([], new Set<string>(['javascript']));
    expect(res).toEqual({ completed: 0, total: 0, percentage: 0 });
  });
});
