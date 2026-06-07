import type { AppSubscriptionBillingCycle } from '@ahmedrioueche/actocore-shared';
import type { PayPalSubscriptionCustomData } from '../paypal-webhook.types';

export function encodePayPalCustomId(data: {
  accountId: string;
  planId: string;
  billingCycle: AppSubscriptionBillingCycle;
}): string {
  return JSON.stringify(data);
}

export function decodePayPalCustomId(
  customId: string | undefined,
): PayPalSubscriptionCustomData | null {
  if (!customId?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(customId) as PayPalSubscriptionCustomData;
    if (parsed.accountId && parsed.planId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
