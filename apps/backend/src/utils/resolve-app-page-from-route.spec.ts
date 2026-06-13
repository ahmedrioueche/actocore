import 'reflect-metadata';
import {
  enrichHostContext,
  matchAppPageRoutePattern,
  normalizeRoutePath,
  resolveAppPageFromRoute,
} from '@ahmedrioueche/actocore-shared';
import type { AppPageManifestEntry } from '@ahmedrioueche/actocore-shared';

const pages: AppPageManifestEntry[] = [
  {
    id: 'members',
    title: 'Members',
    route: '/members',
    description: 'Member list',
  },
  {
    id: 'member_detail',
    title: 'Member detail',
    route: '/members/:id',
  },
  {
    id: 'settings',
    title: 'Settings',
    route: '/settings',
  },
];

describe('resolve-app-page-from-route', () => {
  it('normalizes paths', () => {
    expect(normalizeRoutePath('/members/')).toBe('/members');
    expect(normalizeRoutePath('/members?tab=1')).toBe('/members');
  });

  it('matches static and param routes', () => {
    expect(matchAppPageRoutePattern('/members', '/members')).toBe(true);
    expect(matchAppPageRoutePattern('/members/:id', '/members/42')).toBe(true);
    expect(matchAppPageRoutePattern('/members', '/members/42')).toBe(false);
  });

  it('picks the most specific page pattern', () => {
    expect(resolveAppPageFromRoute('/members', pages)?.id).toBe('members');
    expect(resolveAppPageFromRoute('/members/42', pages)?.id).toBe(
      'member_detail',
    );
    expect(resolveAppPageFromRoute('/settings', pages)?.id).toBe('settings');
    expect(resolveAppPageFromRoute('/unknown', pages)).toBeNull();
  });

  it('enriches hostContext with currentPage from route', () => {
    expect(
      enrichHostContext({ route: '/members/42' }, pages)?.currentPage,
    ).toBe('member_detail');
    expect(
      enrichHostContext(
        { route: '/members/42', currentPage: 'settings' },
        pages,
      )?.currentPage,
    ).toBe('settings');
  });
});
