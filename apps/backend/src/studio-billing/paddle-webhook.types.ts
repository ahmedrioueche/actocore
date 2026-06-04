export type PaddleWebhookPayload = {
  event_id?: string;
  event_type: string;
  occurred_at?: string;
  data: Record<string, unknown>;
};
