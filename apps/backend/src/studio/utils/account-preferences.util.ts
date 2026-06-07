import type { StudioAccountPreferences } from '@ahmedrioueche/actocore-shared';

import type { StudioAccountPreferencesSchema } from '../schemas/studio-account.schema';

export function normalizeAccountPreferences(
  prefs?: StudioAccountPreferencesSchema | null,
): StudioAccountPreferences {
  const legacyQuota =
    prefs?.quotaAlertEmails !== undefined ? prefs.quotaAlertEmails : true;

  const quotaWarningEmails =
    prefs?.quotaWarningEmails !== undefined
      ? prefs.quotaWarningEmails
      : legacyQuota;
  const quotaExhaustedEmails =
    prefs?.quotaExhaustedEmails !== undefined
      ? prefs.quotaExhaustedEmails
      : legacyQuota;

  return {
    quotaAlertEmails: quotaWarningEmails && quotaExhaustedEmails,
    quotaWarningEmails,
    quotaExhaustedEmails,
    failureAlertEmails: prefs?.failureAlertEmails ?? true,
    billingEmails: prefs?.billingEmails ?? true,
    productEmails: prefs?.productEmails ?? false,
    quotaWebhookUrl: prefs?.quotaWebhookUrl,
  };
}
