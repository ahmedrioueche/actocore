import { describe, expect, it } from 'vitest';

import { getProjectNavLinks } from '@/constants/navigation';

describe('getProjectNavLinks', () => {
  it('lists overview as the project landing route', () => {
    const links = getProjectNavLinks('proj_123');

    expect(links[0]).toMatchObject({
      path: '/projects/proj_123',
      labelKey: 'nav.project.overview',
      exact: true,
    });
  });

  it('places integration docs on a dedicated sub-route', () => {
    const links = getProjectNavLinks('proj_123');
    const docs = links.find((link) => link.labelKey === 'nav.project.docs');

    expect(docs).toMatchObject({
      path: '/projects/proj_123/docs',
      matchPaths: ['/projects/proj_123/docs'],
    });
  });
});
