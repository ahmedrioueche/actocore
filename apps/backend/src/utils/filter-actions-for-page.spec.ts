import 'reflect-metadata';
import {
  filterActionsForPageScope,
  resolveAppPageIdBySlug,
} from '@ahmedrioueche/actocore-shared';
import type {
  ActionData,
  AppPageManifestEntry,
} from '@ahmedrioueche/actocore-shared';

const pages: AppPageManifestEntry[] = [
  {
    id: 'members',
    pageId: 'page-members',
    title: 'Members',
    route: '/members',
  },
];

const actions: ActionData[] = [
  {
    id: '1',
    projectId: 'p1',
    name: 'add_member',
    enabled: true,
    inputSchema: {},
    pageIds: ['page-members'],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '2',
    projectId: 'p1',
    name: 'list_users',
    enabled: true,
    inputSchema: {},
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '3',
    projectId: 'p1',
    name: 'billing_export',
    enabled: true,
    inputSchema: {},
    pageIds: ['page-billing'],
    createdAt: '',
    updatedAt: '',
  },
];

describe('filter-actions-for-page', () => {
  it('resolves page id from slug', () => {
    expect(resolveAppPageIdBySlug('members', pages)).toBe('page-members');
    expect(resolveAppPageIdBySlug('unknown', pages)).toBeUndefined();
  });

  it('returns only actions linked to the current page', () => {
    const filtered = filterActionsForPageScope(actions, 'members', pages);
    expect(filtered.map((action) => action.name)).toEqual(['add_member']);
  });

  it('returns nothing when page context is missing', () => {
    const filtered = filterActionsForPageScope(actions, undefined, pages);
    expect(filtered).toEqual([]);
  });
});
