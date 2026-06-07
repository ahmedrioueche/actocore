import type { AuditInfo, PaymentMethod, SupportedCurrency } from './billing-common';

export const APP_PAYMENT_PROVIDERS = ['paddle', 'internal'] as const;
export const APP_SUBSCRIPTION_BILLING_CYCLES = ['monthly', 'yearly'] as const;
export const APP_PLAN_LEVELS = ['free', 'starter', 'pro', 'premium'] as const;

export const APP_SUBSCRIPTION_STATUSES = [
  'active',
  'expired',
  'cancelled',
  'trialing',
] as const;

export const APP_SUBSCRIPTION_HISTORY_ACTIONS = [
  'created',
  'upgraded',
  'downgraded',
  'renewed',
  'cancelled',
  'expired',
  'reactivated',
  'downgrade_scheduled',
  'switch_scheduled',
  'pending_change_cancelled',
] as const;

export type AppPaymentProvider = (typeof APP_PAYMENT_PROVIDERS)[number];
export type AppSubscriptionBillingCycle =
  (typeof APP_SUBSCRIPTION_BILLING_CYCLES)[number];
export type AppPlanLevel = (typeof APP_PLAN_LEVELS)[number];
export type AppSubscriptionStatus = (typeof APP_SUBSCRIPTION_STATUSES)[number];
export type AppSubscriptionHistoryAction =
  (typeof APP_SUBSCRIPTION_HISTORY_ACTIONS)[number];

export type AppPlanPricing = {
  [currency in SupportedCurrency]?: {
    monthly?: number;
    yearly?: number;
  };
};

export interface StudioPlanLimits {
  maxProjects?: number;
  maxTeamSeats?: number;
  monthlyChatQuota?: number;
}

export interface StudioPlan extends AuditInfo {
  id: string;
  planId: string;
  version?: number;
  level: AppPlanLevel;
  order?: number;
  name: string;
  description?: string;
  isActive?: boolean;
  pricing: AppPlanPricing;
  paddleProductId?: string;
  paddlePriceIds?: {
    monthly?: string;
    yearly?: string;
  };
  trialDays?: number;
  limits: StudioPlanLimits;
  /** Marketing bullets shown on the subscription page (editable via super-admin API). */
  features?: string[];
}

export interface StudioSubscription extends AuditInfo {
  id: string;
  accountId: string;
  planId: string;
  plan?: StudioPlan | null;
  startDate: string;
  endDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  status: AppSubscriptionStatus;
  paymentMethod?: PaymentMethod;
  autoRenew?: boolean;
  billingCycle?: AppSubscriptionBillingCycle;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  trial?: {
    startDate: string;
    endDate: string;
    hasUsedTrial: boolean;
    convertedToPaid?: boolean;
  };
  cancelledAt?: string;
  cancelAtPeriodEnd?: boolean;
  cancellationReason?: string;
  pendingPlanId?: string;
  pendingBillingCycle?: AppSubscriptionBillingCycle;
  pendingChangeEffectiveDate?: string;
  provider: AppPaymentProvider;
  paddleSubscriptionId?: string;
  paddleCustomerId?: string;
}

export interface StudioTrialEligibility {
  eligible: boolean;
  planId: string;
  trialDays?: number;
  reason?: string;
  message?: string;
}

export interface StudioTrialStatus {
  hasUsedTrial: boolean;
  isTrialing: boolean;
  trialEndsAt?: string;
  daysRemaining?: number;
}

export interface StudioSubscriptionSummary {
  subscription: StudioSubscription | null;
  limits: StudioPlanLimits;
  usage?: {
    projectsUsed: number;
    teamSeatsUsed: number;
    monthlyChatUsed: number;
  };
  trial?: StudioTrialStatus;
}

export interface PaddleCheckoutData {
  checkout_url: string;
  transaction_id: string;
  trialEligible?: boolean;
  trialDays?: number;
}

export interface PaddleTransactionStatusData {
  id: string;
  status: string;
  subscription_id?: string;
}

export interface StudioUpgradePreviewData {
  targetPlanId: string;
  billingCycle: AppSubscriptionBillingCycle;
  prorationBillingMode: string;
  currencyCode?: string;
  /** Formatted money string from Paddle (e.g. "12.34") when available */
  immediateTotal?: string;
  nextBillingTotal?: string;
}

export interface StudioCustomerPortalData {
  portalUrl: string;
  subscriptionPortalUrl?: string;
}

export interface StudioBillingHistoryEntry {
  id: string;
  accountId: string;
  subscriptionId: string;
  planId: string;
  action: string;
  status: string;
  amountPaid?: number;
  currency?: string;
  details?: string;
  createdAt: string;
}
