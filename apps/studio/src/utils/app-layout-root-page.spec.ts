import { describe, expect, it } from 'vitest';

import type { AppPageData } from '@ahmedrioueche/actocore-shared';

import {
  findRootContainerPage,
  isContainerPage,
  resolveDefaultParentPageId,
} from './app-layout-root-page';

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

describe('app-layout-root-page', () => {
  it('finds the root container page by slug', () => {
    const pages = [
      basePage({ id: 'root', slug: 'root', pageKind: 'container' }),
      basePage({ id: 'login', slug: 'login', route: '/login' }),
    ];

    expect(findRootContainerPage(pages)?.id).toBe('root');
    expect(isContainerPage(pages[0]!)).toBe(true);
  });

  it('defaults new pages under root when no parent is set', () => {
    const pages = [
      basePage({ id: 'root', slug: 'root', pageKind: 'container' }),
      basePage({ id: 'login', slug: 'login', route: '/login' }),
    ];

    expect(resolveDefaultParentPageId(pages)).toBe('root');
    expect(resolveDefaultParentPageId(pages, 'login')).toBe('login');
  });
});
