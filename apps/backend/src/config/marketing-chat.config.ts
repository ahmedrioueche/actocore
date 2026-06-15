function parseOrigins(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export interface MarketingChatResolvedConfig {
  enabled: boolean;
  projectId: string | null;
  allowedOrigins: string[];
  rateLimitPerMinute: number;
}

export function resolveMarketingChatConfig(): MarketingChatResolvedConfig {
  const enabled = process.env.MARKETING_CHAT_ENABLED?.trim() === 'true';
  const projectId = process.env.MARKETING_CHAT_PROJECT_ID?.trim() || null;

  return {
    enabled,
    projectId,
    allowedOrigins: parseOrigins(process.env.MARKETING_CHAT_ALLOWED_ORIGINS),
    rateLimitPerMinute: parseInt(
      process.env.MARKETING_CHAT_RATE_LIMIT_PER_MINUTE ?? '30',
      10,
    ),
  };
}
