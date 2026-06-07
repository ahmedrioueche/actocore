import type { StudioBillingHistoryEntry } from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

function isLegacyTrialCreated(entry: StudioBillingHistoryEntry): boolean {
  return (
    entry.action === 'created' &&
    Boolean(entry.details?.toLowerCase().includes('free trial'))
  );
}

function parseTrialDays(details?: string): number | undefined {
  if (!details) {
    return undefined;
  }
  if (/^\d+$/.test(details)) {
    return Number(details);
  }
  const match = details.match(/(\d+)-day/i);
  return match ? Number(match[1]) : undefined;
}

export function formatBillingHistoryAction(
  t: TFunction,
  entry: StudioBillingHistoryEntry,
): string {
  if (isLegacyTrialCreated(entry)) {
    return t('billing.history.actions.trial_started');
  }
  const key = `billing.history.actions.${entry.action}`;
  const translated = t(key);
  return translated === key ? entry.action : translated;
}

export function formatBillingHistoryDetails(
  t: TFunction,
  entry: StudioBillingHistoryEntry,
): string | undefined {
  if (entry.action === 'trial_started' || isLegacyTrialCreated(entry)) {
    const days = parseTrialDays(entry.details);
    if (days != null) {
      return t('billing.history.trialDays', { count: days });
    }
    return undefined;
  }

  if (entry.action === 'trial_ended' || entry.action === 'expired') {
    return undefined;
  }

  if (entry.action === 'subscribed' && entry.details) {
    return entry.details;
  }

  if (entry.action === 'created' && entry.details) {
    const subscribed = entry.details.match(/^Subscribed to (.+)$/i);
    if (subscribed) {
      return subscribed[1];
    }
  }

  return entry.details;
}
