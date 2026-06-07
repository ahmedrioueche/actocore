export interface PayPalWebhookPayload {
  id: string;
  event_type: string;
  resource: Record<string, unknown>;
  resource_type?: string;
  summary?: string;
  create_time?: string;
}

export interface PayPalSubscriptionCustomData {
  accountId?: string;
  planId?: string;
  billingCycle?: string;
}
