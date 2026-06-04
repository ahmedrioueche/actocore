/** Tenant workspace settings (Studio account). */
export interface StudioAccountPreferences {
  quotaAlertEmails: boolean;
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
