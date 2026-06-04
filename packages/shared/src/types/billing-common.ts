export const SUPPORTED_CURRENCIES = ['USD', 'EUR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = 'USD';

export const PAYMENT_METHODS = ['card', 'paypal', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface AuditInfo {
  createdAt: string | Date;
  updatedAt?: string | Date;
  createdBy?: string;
  updatedBy?: string;
}
