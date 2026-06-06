import type {
  ListActionsQuery,
  ListProjectsQuery,
  PaginationQuery,
} from "@ahmedrioueche/actocore-shared";

/** Central query keys — keep server cache predictable. */
export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  projects: {
    all: () => ["projects"] as const,
    list: (params: ListProjectsQuery = {}) =>
      ["projects", "list", params] as const,
    detail: (projectId: string) => ["projects", "detail", projectId] as const,
  },
  team: {
    members: () => ["team", "members"] as const,
  },
  account: {
    settings: () => ["account", "settings"] as const,
  },
  billing: {
    subscription: () => ["billing", "subscription"] as const,
    quota: () => ["billing", "quota"] as const,
  },
  onboarding: {
    state: () => ["onboarding", "state"] as const,
  },
  apiKeys: {
    lists: (projectId: string) => ["apiKeys", "list", projectId] as const,
    list: (projectId: string, params: PaginationQuery = {}) =>
      ["apiKeys", "list", projectId, params] as const,
  },
  knowledge: {
    lists: (projectId: string) => ["knowledge", "list", projectId] as const,
    list: (projectId: string, params: PaginationQuery = {}) =>
      ["knowledge", "list", projectId, params] as const,
  },
  actions: {
    lists: (projectId: string) => ["actions", "list", projectId] as const,
    list: (projectId: string, params: ListActionsQuery = {}) =>
      ["actions", "list", projectId, params] as const,
    detail: (projectId: string, actionId: string) =>
      ["actions", "detail", projectId, actionId] as const,
  },
  actionSections: {
    list: (projectId: string) => ["actionSections", "list", projectId] as const,
  },
} as const;
