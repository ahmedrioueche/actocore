import { describe, expect, it } from 'vitest';

import type { AppPageData } from '@ahmedrioueche/actocore-shared';

import {
  buildGraphPositions,
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

  it('auto-places pages on a grid', () => {
    const positions = buildGraphPositions([
      basePage({ id: 'a' }),
      basePage({ id: 'b', slug: 'settings', route: '/settings' }),
      basePage({ id: 'c', slug: 'billing', route: '/billing' }),
    ]);

    expect(positions.a).toEqual({ x: 80, y: 80 });
    expect(positions.b).toEqual({ x: 400, y: 80 });
    expect(positions.c).toEqual({ x: 720, y: 80 });
  });
});
