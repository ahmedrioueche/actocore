import { describe, expect, it, vi } from 'vitest';

import type { StudioBillingHistoryEntry } from '@ahmedrioueche/actocore-shared';

import {
  formatBillingHistoryAction,
  formatBillingHistoryDetails,
} from './billing-history';

const t = vi.fn((key: string, options?: Record<string, unknown>) => {
  if (key === 'billing.history.actions.trial_started') {
    return 'Trial started';
  }
  if (key === 'billing.history.actions.subscribed') {
    return 'Subscribed';
  }
  if (key === 'billing.history.trialDays') {
    return `${options?.count} days`;
  }
  return key;
});

const baseEntry: StudioBillingHistoryEntry = {
  id: '1',
  accountId: 'a1',
  subscriptionId: 's1',
  planId: 'free',
  action: 'trial_started',
  status: 'trialing',
  createdAt: new Date().toISOString(),
};

describe('billing-history formatting', () => {
  it('formats new trial events', () => {
    expect(
      formatBillingHistoryAction(t, { ...baseEntry, details: '14' }),
    ).toBe('Trial started');
    expect(
      formatBillingHistoryDetails(t, { ...baseEntry, details: '14' }),
    ).toBe('14 days');
  });

  it('formats legacy trial created events', () => {
    const legacy = {
      ...baseEntry,
      action: 'created',
      details: 'Started 14-day free trial on Free',
    };

    expect(formatBillingHistoryAction(t, legacy)).toBe('Trial started');
    expect(formatBillingHistoryDetails(t, legacy)).toBe('14 days');
  });

  it('formats paid subscriptions', () => {
    const entry = {
      ...baseEntry,
      action: 'subscribed',
      planId: 'starter',
      details: 'Starter',
    };

    expect(formatBillingHistoryAction(t, entry)).toBe('Subscribed');
    expect(formatBillingHistoryDetails(t, entry)).toBe('Starter');
  });
});
