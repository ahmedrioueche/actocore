/** Tenant workspace settings (Studio account). */
export interface StudioAccountPreferences {
  /** @deprecated Use quotaWarningEmails + quotaExhaustedEmails. Kept for API compat. */
  quotaAlertEmails?: boolean;
  /** Email when monthly chat usage crosses 80% / 90%. */
  quotaWarningEmails: boolean;
  /** Email when monthly chat usage reaches 100%. */
  quotaExhaustedEmails: boolean;
  /** Email on LLM/provider failures and billing payment failures. */
  failureAlertEmails: boolean;
  billingEmails: boolean;
  productEmails: boolean;
  quotaWebhookUrl?: string;
}

export interface StudioAccountSettingsData {
  id: string;
  name: string;
  billingEmail?: string;
  timezone?: string;
  defaultLocale?: string;
  preferences: StudioAccountPreferences;
  createdAt: string;
  updatedAt: string;
}
