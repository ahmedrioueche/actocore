import type { StudioListQueryParams } from '@/types/pagination';

/** Central query keys — keep server cache predictable. */
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  projects: {
    all: () => ['projects'] as const,
    list: (params: StudioListQueryParams) =>
      ['projects', 'list', params] as const,
    detail: (projectId: string) => ['projects', 'detail', projectId] as const,
  },
  team: {
    members: () => ['team', 'members'] as const,
  },
} as const;
