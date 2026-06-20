import type {
  AppPageLinkManifestEntry,
  AppPageManifestEntry,
} from '@ahmedrioueche/actocore-shared';

import { buildAppSitemapBlock } from './app-sitemap.util';

describe('buildAppSitemapBlock', () => {
  it('renders hierarchical pages with container labels', () => {
    const pages: AppPageManifestEntry[] = [
      {
        id: 'root',
        pageId: '1',
        title: 'Root',
        route: '/',
        pageKind: 'container',
        description: 'Product map root',
      },
      {
        id: 'login',
        pageId: '2',
        title: 'Login',
        route: '/login',
        parentPageId: '1',
        parentPageSlug: 'root',
      },
      {
        id: 'projects',
        pageId: '3',
        title: 'Projects',
        route: '/projects',
        parentPageId: '1',
        parentPageSlug: 'root',
      },
    ];

    const block = buildAppSitemapBlock(pages);
    expect(block).toContain('root [container]: Root — Product map root');
    expect(block).toContain('  - login (/login): Login');
    expect(block).toContain('  - projects (/projects): Projects');
  });

  it('renders navigation links with page slugs', () => {
    const pages: AppPageManifestEntry[] = [
      {
        id: 'login',
        pageId: '2',
        title: 'Login',
        route: '/login',
      },
      {
        id: 'projects',
        pageId: '3',
        title: 'Projects',
        route: '/projects',
      },
    ];
    const pageLinks: AppPageLinkManifestEntry[] = [
      {
        sourcePageId: '2',
        targetPageId: '3',
        label: 'after sign-in',
      },
    ];

    const block = buildAppSitemapBlock(pages, pageLinks);
    expect(block).toContain('Page navigation (explicit user paths only):');
    expect(block).toContain('- login → projects (after sign-in)');
  });
});
