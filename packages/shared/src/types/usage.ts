export interface UsageEventData {
  id: string;
  projectId: string;
  route: string;
  intent?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  apiKeyId?: string;
  createdAt: string;
}

export interface UsageSummaryData {
  projectId: string;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  byIntent: Record<string, number>;
}
