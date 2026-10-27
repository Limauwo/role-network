import { describe, it, expect } from 'vitest';
import {
  getTechStackForRole,
  groupTechStackByCategory,
  computeLearningOrder,
  getAncestorPathToExpand,
  extractDomain,
} from './traversal';
import type { GraphData } from '../types/graph';

const testGraphData: GraphData = {
  nodes: [
    { id: 'it', label: 'IT', type: 'root' },
    { id: 'web-dev', label: 'Web Dev', type: 'field' },
    { id: 'frontend', label: 'Frontend', type: 'specialization' },
    { id: 'backend', label: 'Backend', type: 'specialization' },
    { id: 'fullstack', label: 'Fullstack', type: 'specialization' },
    { id: 'fe-dev', label: 'Frontend Developer', type: 'role' },
    { id: 'be-dev', label: 'Backend Developer', type: 'role' },
    { id: 'fs-dev', label: 'Fullstack Developer', type: 'role' },
    {
      id: 'html',
      label: 'HTML5',
      type: 'skill',
      category: 'language',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
    },
    {
      id: 'css',
      label: 'CSS3',
      type: 'skill',
      category: 'language',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    },
    {
      id: 'javascript',
      label: 'JavaScript',
      type: 'skill',
      category: 'language',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    },
    {
      id: 'react',
      label: 'React',
      type: 'skill',
      category: 'framework',
      docsUrl: 'https://react.dev/',
    },
    {
      id: 'nodejs',
      label: 'Node.js',
      type: 'skill',
      category: 'platform',
      docsUrl: 'https://nodejs.org/en/docs',
    },
    {
      id: 'postgres',
      label: 'PostgreSQL',
      type: 'skill',
      category: 'database',
      docsUrl: 'https://www.postgresql.org/docs/',
    },
    {
      id: 'git',
      label: 'Git',
      type: 'tool',
      category: 'tooling',
      docsUrl: 'https://git-scm.com/doc',
    },
  ],
  edges: [
    { source: 'it', target: 'web-dev', kind: 'part_of' },
    { source: 'web-dev', target: 'frontend', kind: 'part_of' },
    { source: 'web-dev', target: 'backend', kind: 'part_of' },
    { source: 'web-dev', target: 'fullstack', kind: 'part_of' },
    { source: 'frontend', target: 'fe-dev', kind: 'part_of' },
    { source: 'backend', target: 'be-dev', kind: 'part_of' },
    { source: 'fullstack', target: 'fs-dev', kind: 'part_of' },

    // Frontend role stack
    { source: 'fe-dev', target: 'git', kind: 'part_of' },
    { source: 'fe-dev', target: 'html', kind: 'part_of' },
    { source: 'fe-dev', target: 'css', kind: 'part_of' },
    { source: 'fe-dev', target: 'javascript', kind: 'part_of' },
    { source: 'fe-dev', target: 'react', kind: 'part_of' },

    // Backend role stack
    { source: 'be-dev', target: 'git', kind: 'part_of' },
    { source: 'be-dev', target: 'javascript', kind: 'part_of' },
    { source: 'be-dev', target: 'nodejs', kind: 'part_of' },
    { source: 'be-dev', target: 'postgres', kind: 'part_of' },

    // Fullstack role connects to frontend and backend roles
    { source: 'fs-dev', target: 'fe-dev', kind: 'part_of' },
    { source: 'fs-dev', target: 'be-dev', kind: 'part_of' },

    // Prerequisites
    { source: 'html', target: 'css', kind: 'prerequisite' },
    { source: 'css', target: 'javascript', kind: 'prerequisite' },
    { source: 'javascript', target: 'react', kind: 'prerequisite' },
    { source: 'javascript', target: 'nodejs', kind: 'prerequisite' },
  ],
};

describe('traversal logic', () => {
  it('extracts tech stack for frontend role', () => {
    const stack = getTechStackForRole('fe-dev', testGraphData);
    const ids = stack.map((s) => s.id);
    expect(ids).toContain('git');
    expect(ids).toContain('html');
    expect(ids).toContain('css');
    expect(ids).toContain('javascript');
    expect(ids).toContain('react');
    expect(ids).not.toContain('postgres');
  });

  it('extracts full tech stack for fullstack role recursively', () => {
    const stack = getTechStackForRole('fs-dev', testGraphData);
    const ids = stack.map((s) => s.id);
    expect(ids).toContain('git');
    expect(ids).toContain('html');
    expect(ids).toContain('css');
    expect(ids).toContain('javascript');
    expect(ids).toContain('react');
    expect(ids).toContain('nodejs');
    expect(ids).toContain('postgres');
    // Ensure no duplicates
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('groups tech stack by category properly', () => {
    const stack = getTechStackForRole('fe-dev', testGraphData);
    const grouped = groupTechStackByCategory(stack);

    const languageGroup = grouped.find((g) => g.category === 'language');
    expect(languageGroup).toBeDefined();
    expect(languageGroup?.items.map((i) => i.id)).toEqual(['css', 'html', 'javascript']);

    const frameworkGroup = grouped.find((g) => g.category === 'framework');
    expect(frameworkGroup).toBeDefined();
    expect(frameworkGroup?.items.map((i) => i.id)).toEqual(['react']);

    const toolingGroup = grouped.find((g) => g.category === 'tooling');
    expect(toolingGroup).toBeDefined();
    expect(toolingGroup?.items.map((i) => i.id)).toEqual(['git']);
  });

  it('computes learning order via topological sorting on prerequisites', () => {
    const stack = getTechStackForRole('fe-dev', testGraphData);
    const order = computeLearningOrder(stack, testGraphData);
    const orderIds = order.map((o) => o.id);

    // html must precede css
    expect(orderIds.indexOf('html')).toBeLessThan(orderIds.indexOf('css'));
    // css must precede javascript
    expect(orderIds.indexOf('css')).toBeLessThan(orderIds.indexOf('javascript'));
    // javascript must precede react
    expect(orderIds.indexOf('javascript')).toBeLessThan(orderIds.indexOf('react'));
  });

  it('finds ancestor path required to expand a deep target node', () => {
    const ancestors = getAncestorPathToExpand('fe-dev', testGraphData);
    expect(ancestors).toContain('frontend');
    expect(ancestors).toContain('web-dev');
    expect(ancestors).toContain('it');
  });

  it('extracts clean domain name from URLs', () => {
    expect(extractDomain('https://react.dev/learn')).toBe('react.dev');
    expect(extractDomain('https://www.typescriptlang.org/docs/')).toBe('typescriptlang.org');
    expect(extractDomain('https://developer.mozilla.org/en-US/docs/Web/HTML')).toBe(
      'developer.mozilla.org'
    );
    expect(extractDomain('')).toBe('');
    expect(extractDomain('invalid-url')).toBe('');
  });
});
