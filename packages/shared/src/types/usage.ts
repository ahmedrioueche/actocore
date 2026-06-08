export interface UsageEventData {
  id: string;
  projectId: string;
  route: string;
  intent?: string;
  provider?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  apiKeyId?: string;
  latencyMs?: number;
  success?: boolean;
  errorCode?: string;
  createdAt: string;
}

export interface UsageRouteBreakdownRow {
  route: string;
  requests: number;
  errors: number;
  errorRate: number;
  p95LatencyMs: number | null;
}

export interface ProjectUsageBreakdownData {
  projectId: string;
  from?: string;
  to?: string;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  p95LatencyMs: number | null;
  byRoute: UsageRouteBreakdownRow[];
}

export interface UsageSummaryData {
  projectId: string;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  byIntent: Record<string, number>;
  from?: string;
  to?: string;
  byModel?: Record<string, number>;
  byApiKey?: Record<string, number>;
}

export interface UsageDailyBucket {
  date: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
}

export interface UsageTimeSeriesData {
  projectId: string;
  from: string;
  to: string;
  granularity: 'day';
  buckets: UsageDailyBucket[];
}

export interface UsageEventsPageData {
  projectId: string;
  items: UsageEventData[];
  total: number;
  page: number;
  limit: number;
}

export interface AccountUsageProjectRow {
  projectId: string;
  projectName: string;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

export interface AccountUsageSummaryData {
  accountId: string;
  from?: string;
  to?: string;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  byIntent: Record<string, number>;
  projects: AccountUsageProjectRow[];
}

export interface ProjectQuotaStatusData {
  projectId: string;
  enforced: boolean;
  monthlyChatUsed: number;
  monthlyChatLimit: number | null;
  limitsSource: 'plan' | 'env' | 'none';
  perMinuteLimit: number;
  perDayLimit: number;
}

/** Tenant-facing quota widget (account-level, all projects). */
export interface AccountQuotaStatusData {
  accountId: string;
  enforced: boolean;
  monthlyChatUsed: number;
  monthlyChatLimit: number | null;
  percentUsed: number | null;
  limitsSource: 'plan' | 'env' | 'none';
  perMinuteLimit: number;
  perDayLimit: number;
  alertPercentages: [number, number, number];
}

export interface ProjectKnowledgeUsageData {
  projectId: string;
  from?: string;
  to?: string;
  sourcesTotal: number;
  sourcesReady: number;
  sourcesPending: number;
  sourcesError: number;
  totalChunks: number;
  totalBytes: number;
  estimatedEmbeddingTokens: number;
  byType: Record<string, number>;
}

export interface ProjectSessionUsageData {
  projectId: string;
  from?: string;
  to?: string;
  sessionsCreated: number;
  messagesTotal: number;
  userMessages: number;
  assistantMessages: number;
  chatRequestsInRange: number;
  byIntent: Record<string, number>;
}

export interface UsageProviderBreakdownRow {
  requests: number;
  promptTokens: number;
  completionTokens: number;
}

export interface PlatformUsageAccountRow {
  accountId: string;
  accountName: string;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

export interface PlatformUsageProjectRow {
  projectId: string;
  projectName: string;
  accountId: string;
  accountName: string;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

export interface PlatformUsageOverviewData {
  from: string;
  to: string;
  configuredProvider: string;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalErrors: number;
  errorRate: number;
  p95LatencyMs: number | null;
  byProvider: Record<string, UsageProviderBreakdownRow>;
  byModel: Record<string, number>;
  byIntent: Record<string, number>;
  buckets: UsageDailyBucket[];
  topAccounts: PlatformUsageAccountRow[];
  topProjects: PlatformUsageProjectRow[];
}
