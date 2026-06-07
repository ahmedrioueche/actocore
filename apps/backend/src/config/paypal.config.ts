export type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  webhookId: string;
  apiBaseUrl: string;
  returnUrl: string;
  cancelUrl: string;
};

export function resolvePayPalConfig(): PayPalConfig {
  const sandbox = process.env.PAYPAL_API_BASE_URL?.includes('sandbox') ?? true;
  const defaultBase = sandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  return {
    clientId: process.env.PAYPAL_CLIENT_ID ?? '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID ?? '',
    apiBaseUrl: process.env.PAYPAL_API_BASE_URL ?? defaultBase,
    returnUrl:
      process.env.PAYPAL_RETURN_URL ??
      'http://localhost:5174/subscription',
    cancelUrl:
      process.env.PAYPAL_CANCEL_URL ??
      'http://localhost:5174/subscription',
  };
}
