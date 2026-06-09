import type { AuditInfo, PaymentMethod, SupportedCurrency } from './billing-common';

export const APP_PAYMENT_PROVIDERS = ['paypal', 'internal'] as const;
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
  monthlyTokenQuota?: number;
  maxActionsPerProject?: number;
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
  paypalProductId?: string;
  paypalPlanIds?: {
    monthly?: string;
    yearly?: string;
  };
  trialDays?: number;
  limits: StudioPlanLimits;
  /** Marketing bullets shown on the subscription page (editable via super-admin API). */
  features?: string[];
  /** Highlights this tier on the subscription page (e.g. “Recommended”). */
  isRecommended?: boolean;
  /** Badge copy when yearly billing is selected (e.g. “2 months free”). */
  yearlyDiscountBadge?: string;
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
  paypalSubscriptionId?: string;
  paypalPayerId?: string;
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
    monthlyTokensUsed: number;
  };
  trial?: StudioTrialStatus;
}

export interface PayPalCheckoutData {
  approval_url: string;
  subscription_id: string;
  trialEligible?: boolean;
  trialDays?: number;
}

export interface PayPalSubscriptionStatusData {
  id: string;
  status: string;
  plan_id?: string;
}

export interface StudioUpgradeResult {
  subscription: StudioSubscription;
  approvalUrl?: string;
}

export interface StudioPayPalManageUrlData {
  manageUrl: string;
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
