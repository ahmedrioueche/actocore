import type { ListProjectsQuery } from '@ahmedrioueche/actocore-shared';

/** Central query keys — keep server cache predictable. */
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  projects: {
    all: () => ['projects'] as const,
    list: (params: ListProjectsQuery = {}) =>
      ['projects', 'list', params] as const,
    detail: (projectId: string) => ['projects', 'detail', projectId] as const,
  },
  team: {
    members: () => ['team', 'members'] as const,
  },
  account: {
    settings: () => ['account', 'settings'] as const,
  },
  billing: {
    subscription: () => ['billing', 'subscription'] as const,
    quota: () => ['billing', 'quota'] as const,
  },
  onboarding: {
    state: () => ['onboarding', 'state'] as const,
  },
  apiKeys: {
    list: (projectId: string) => ['apiKeys', 'list', projectId] as const,
  },
} as const;
