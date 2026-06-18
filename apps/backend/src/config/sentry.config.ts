export type SentryConfig = {
  enabled: boolean;
  dsn?: string;
  environment: string;
  tracesSampleRate: number;
};

function parseSampleRate(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return fallback;
  }
  return value;
}

export function resolveSentryConfig(): SentryConfig {
  const dsn = process.env.SENTRY_DSN?.trim();
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const explicitlyDisabled =
    process.env.SENTRY_ENABLED?.trim().toLowerCase() === 'false';
  const enabled = Boolean(dsn) && nodeEnv !== 'test' && !explicitlyDisabled;

  return {
    enabled,
    dsn: enabled ? dsn : undefined,
    environment: process.env.SENTRY_ENVIRONMENT?.trim() || nodeEnv,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
  };
}
