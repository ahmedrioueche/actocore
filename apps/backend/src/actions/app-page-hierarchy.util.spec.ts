import {
  collectDescendantPageIds,
  wouldCreatePageHierarchyCycle,
} from './app-page-hierarchy.util';

describe('app-page-hierarchy.util', () => {
  it('detects a cycle when parent chain includes the page', () => {
    const parentByPageId = new Map<string, string | null | undefined>([
      ['a', null],
      ['b', 'a'],
      ['c', 'b'],
    ]);

    expect(wouldCreatePageHierarchyCycle('a', 'c', parentByPageId)).toBe(true);
    expect(wouldCreatePageHierarchyCycle('b', 'c', parentByPageId)).toBe(true);
    expect(wouldCreatePageHierarchyCycle('c', 'a', parentByPageId)).toBe(false);
  });

  it('collects nested descendants', () => {
    const childrenByParentId = new Map<string, string[]>([
      ['root', ['child', 'sibling']],
      ['child', ['grandchild']],
    ]);

    expect(collectDescendantPageIds('root', childrenByParentId)).toEqual(
      new Set(['child', 'sibling', 'grandchild']),
    );
    expect(collectDescendantPageIds('child', childrenByParentId)).toEqual(
      new Set(['grandchild']),
    );
  });
});
