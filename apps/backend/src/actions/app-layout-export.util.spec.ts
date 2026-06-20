import 'reflect-metadata';
import {
  APP_LAYOUT_EXPORT_FORMAT_VERSION,
  buildAppLayoutExport,
  sortAppLayoutPagesTopologically,
  validateAppLayoutExport,
  type AppLayoutExportV1,
} from '@ahmedrioueche/actocore-shared';

describe('app-layout-export utils', () => {
  it('builds slug-based export from pages and links', () => {
    const layout = buildAppLayoutExport(
      [
        {
          id: 'mongo-root',
          projectId: 'p1',
          slug: 'root',
          title: 'Root',
          route: '/',
          pageKind: 'container',
          description: 'Groups screens',
          enabled: true,
          order: 0,
          parentPageId: null,
          graphPosition: { x: 0, y: 0 },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'mongo-login',
          projectId: 'p1',
          slug: 'login',
          title: 'Login',
          route: '/login',
          enabled: true,
          order: 1,
          parentPageId: 'mongo-root',
          graphPosition: { x: 100, y: 100 },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      [
        {
          id: 'link-1',
          projectId: 'p1',
          sourcePageId: 'mongo-login',
          targetPageId: 'mongo-root',
          label: 'Back',
        },
      ],
      [],
    );

    expect(layout.formatVersion).toBe(APP_LAYOUT_EXPORT_FORMAT_VERSION);
    expect(layout.pages).toHaveLength(2);
    expect(layout.pages[1]?.parentPageSlug).toBe('root');
    expect(layout.links[0]).toEqual({
      sourceSlug: 'login',
      targetSlug: 'root',
      label: 'Back',
    });
  });

  it('sorts pages parents before children', () => {
    const pages = sortAppLayoutPagesTopologically([
      {
        slug: 'child',
        title: 'Child',
        route: '/child',
        parentPageSlug: 'parent',
      },
      {
        slug: 'parent',
        title: 'Parent',
        route: '/parent',
        parentPageSlug: null,
      },
    ]);

    expect(pages.map((page) => page.slug)).toEqual(['parent', 'child']);
  });

  it('rejects invalid parent references', () => {
    const layout: AppLayoutExportV1 = {
      formatVersion: APP_LAYOUT_EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      pages: [
        {
          slug: 'orphan',
          title: 'Orphan',
          route: '/orphan',
          parentPageSlug: 'missing',
        },
      ],
      links: [],
    };

    const result = validateAppLayoutExport(layout);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('missing'))).toBe(true);
  });
});
