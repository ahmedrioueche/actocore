import { describe, expect, it } from 'vitest';

import { buildChildPageFormDefaults } from './app-layout-page-tree';

describe('buildChildPageFormDefaults', () => {
  it('prefixes slug, title, and route from the parent page', () => {
    expect(
      buildChildPageFormDefaults({
        slug: 'projects',
        title: 'Projects',
        route: '/projects',
      }),
    ).toEqual({
      slug: 'projects-',
      title: 'Projects',
      route: '/projects/',
    });
  });

  it('uses the first word of a multi-word parent title', () => {
    expect(
      buildChildPageFormDefaults({
        slug: 'projects',
        title: 'Project knowledge',
        route: '/projects/:projectId/knowledge',
      }),
    ).toEqual({
      slug: 'projects-',
      title: 'Project',
      route: '/projects/:projectId/knowledge/',
    });
  });
});
