import { getAppEnvironment } from './mongodb.config';

export interface QuotaLimits {
  enabled: boolean;
  chatPerMinute: number;
  chatPerDay: number;
  chatPerMonth: number;
  /** Email account admins when monthly usage crosses these % thresholds */
  alertPercentages: [number, number, number];
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  const raw = value?.trim() ?? String(fallback);
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function resolveQuotaLimits(): QuotaLimits {
  const nodeEnv = getAppEnvironment();
  const enabled =
    process.env.QUOTA_ENFORCE === 'true' ||
    (process.env.QUOTA_ENFORCE !== 'false' && nodeEnv === 'production');

  const alertRaw = process.env.QUOTA_ALERT_PERCENTAGES?.trim() || '80,90,100';
  const alertParts = alertRaw.split(',').map((s) => Number(s.trim()));
  if (
    alertParts.length !== 3 ||
    alertParts.some((n) => !Number.isFinite(n) || n < 1 || n > 100)
  ) {
    throw new Error('QUOTA_ALERT_PERCENTAGES must be three integers 1–100 (e.g. 80,90,100)');
  }
  const alertPercentages = alertParts as [number, number, number];

  return {
    enabled,
    alertPercentages,
    chatPerMinute: parsePositiveInt(
      process.env.QUOTA_CHAT_PER_MINUTE,
      nodeEnv === 'test' ? 10_000 : 120,
      'QUOTA_CHAT_PER_MINUTE',
    ),
    chatPerDay: parsePositiveInt(
      process.env.QUOTA_CHAT_PER_DAY,
      nodeEnv === 'test' ? 100_000 : 5_000,
      'QUOTA_CHAT_PER_DAY',
    ),
    chatPerMonth: parsePositiveInt(
      process.env.QUOTA_CHAT_PER_MONTH,
      nodeEnv === 'test' ? 1_000_000 : 100_000,
      'QUOTA_CHAT_PER_MONTH',
    ),
  };
}
