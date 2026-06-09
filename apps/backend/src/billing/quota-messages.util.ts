import type { QuotaLimitWindow } from './exceptions/quota.exception';

/** Shown to end users in the embeddable SDK when a limit is hit. */
export function quotaUserMessage(window: QuotaLimitWindow): string {
  switch (window) {
    case 'minute':
      return 'This assistant is busy right now. Please wait a moment and try again.';
    case 'day':
      return 'This assistant has reached its daily limit. Please try again tomorrow.';
    case 'monthly':
    default:
      return 'This assistant is temporarily unavailable. Please try again later or contact the app owner.';
  }
}

/** Shown to account owners in email / Studio (internal). */
export function quotaOwnerMessage(
  window: QuotaLimitWindow,
  used: number,
  limit: number,
): string {
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 100;
  switch (window) {
    case 'minute':
      return `Your account hit the per-minute chat rate limit (${used}/${limit} requests this minute).`;
    case 'day':
      return `Your account has used ${pct}% of today's chat allowance (${used}/${limit}).`;
    case 'monthly':
    default:
      return `Your account has used ${pct}% of this month's included AI token allowance (${used} of ${limit} tokens).`;
  }
}
