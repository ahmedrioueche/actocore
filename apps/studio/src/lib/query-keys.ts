import type {
  ListActionsQuery,
  ListProjectsQuery,
  PaginationQuery,
} from "@ahmedrioueche/actocore-shared";

/** Central query keys — keep server cache predictable. */
export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
    availableTestAccount: () => ["auth", "available-test-account"] as const,
  },
  platform: {
    me: () => ["platform", "me"] as const,
    accounts: (params: PaginationQuery & { search?: string } = {}) =>
      ["platform", "accounts", params] as const,
    plans: (params: PaginationQuery & { includeInactive?: boolean } = {}) =>
      ["platform", "plans", params] as const,
    managers: () => ["platform", "managers"] as const,
    subscriptions: (
      params: PaginationQuery & { search?: string; status?: string } = {},
    ) => ["platform", "subscriptions", params] as const,
    users: (params: PaginationQuery & { search?: string } = {}) =>
      ["platform", "users", params] as const,
    projects: (params: PaginationQuery & { search?: string } = {}) =>
      ["platform", "projects", params] as const,
    analytics: () => ["platform", "analytics"] as const,
    usage: (params: { from?: string; to?: string } = {}) =>
      ["platform", "usage", params] as const,
    accountSubscription: (accountId: string) =>
      ["platform", "account-subscription", accountId] as const,
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
    quota: () => ["billing", "quota"] as const,
    payments: (params: PaginationQuery = {}) =>
      ["billing", "payments", params] as const,
    paypalManageUrl: () => ["billing", "paypal-manage-url"] as const,
  },
  subscription: {
    summary: () => ["subscription", "summary"] as const,
    plans: () => ["subscription", "plans"] as const,
    trialEligibility: (planId: string) =>
      ["subscription", "trial", planId] as const,
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
  appPages: {
    list: (projectId: string) => ["appPages", "list", projectId] as const,
  },
  sdkConfig: {
    detail: (projectId: string) => ["sdkConfig", "detail", projectId] as const,
  },
  usage: {
    workspace: (params: { from?: string; to?: string } = {}) =>
      ["usage", "workspace", params] as const,
    projectSummary: (
      projectId: string,
      params: { from?: string; to?: string } = {},
    ) => ["usage", "project", projectId, "summary", params] as const,
    projectSeries: (
      projectId: string,
      params: { from?: string; to?: string } = {},
    ) => ["usage", "project", projectId, "series", params] as const,
    projectBreakdown: (
      projectId: string,
      params: { from?: string; to?: string } = {},
    ) => ["usage", "project", projectId, "breakdown", params] as const,
  },
} as const;
