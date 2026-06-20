import { describe, expect, it } from 'vitest';

import type { AppPageData } from '@ahmedrioueche/actocore-shared';

import {
  buildGraphPositions,
  buildTreeGraphLayout,
  resolveAppPageGraphPosition,
} from './app-layout-graph-layout';

const basePage = (overrides: Partial<AppPageData>): AppPageData => ({
  id: '1',
  projectId: 'p1',
  slug: 'home',
  title: 'Home',
  route: '/',
  enabled: true,
  order: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('app-layout-graph-layout', () => {
  it('uses saved graphPosition when present', () => {
    expect(
      resolveAppPageGraphPosition(
        basePage({ graphPosition: { x: 10, y: 20 } }),
        0,
      ),
    ).toEqual({ x: 10, y: 20 });
  });

  it('auto-places pages on a grid when there is no hierarchy', () => {
    const positions = buildGraphPositions([
      basePage({ id: 'a' }),
      basePage({ id: 'b', slug: 'settings', route: '/settings' }),
      basePage({ id: 'c', slug: 'billing', route: '/billing' }),
    ]);

    expect(positions.a).toEqual({ x: 80, y: 80 });
    expect(positions.b).toEqual({ x: 400, y: 80 });
    expect(positions.c).toEqual({ x: 720, y: 80 });
  });

  it('lays out a parent with two children in a tree', () => {
    const positions = buildTreeGraphLayout([
      basePage({ id: 'root', slug: 'projects', route: '/projects' }),
      basePage({
        id: 'child-a',
        slug: 'knowledge',
        route: '/projects/:id/knowledge',
        parentPageId: 'root',
      }),
      basePage({
        id: 'child-b',
        slug: 'actions',
        route: '/projects/:id/actions',
        parentPageId: 'root',
      }),
    ]);

    expect(positions.root.y).toBeLessThan(positions['child-a'].y);
    expect(positions.root.y).toBeLessThan(positions['child-b'].y);
    expect(positions['child-a'].x).not.toEqual(positions['child-b'].x);
  });

  it('uses tree layout from buildGraphPositions when hierarchy exists', () => {
    const positions = buildGraphPositions([
      basePage({ id: 'root', slug: 'projects', route: '/projects' }),
      basePage({
        id: 'child',
        slug: 'knowledge',
        route: '/projects/:id/knowledge',
        parentPageId: 'root',
      }),
    ]);

    expect(positions.child.y).toBeGreaterThan(positions.root.y);
  });

  it('places a new child below a parent with a saved graph position', () => {
    const positions = buildGraphPositions(
      [
        basePage({
          id: 'root',
          slug: 'projects',
          route: '/projects',
          graphPosition: { x: 420, y: 160 },
        }),
        basePage({
          id: 'child',
          slug: 'projects-knowledge',
          route: '/projects/knowledge',
          parentPageId: 'root',
        }),
      ],
      new Map([['root', { x: 420, y: 160 }]]),
    );

    expect(positions.child).toEqual({ x: 420, y: 400 });
  });

  it('places a new root page beside existing positioned pages', () => {
    const positions = buildGraphPositions([
      basePage({
        id: 'a',
        graphPosition: { x: 80, y: 80 },
      }),
      basePage({
        id: 'b',
        slug: 'settings',
        route: '/settings',
      }),
    ]);

    expect(positions.b).toEqual({ x: 416, y: 80 });
  });
});
