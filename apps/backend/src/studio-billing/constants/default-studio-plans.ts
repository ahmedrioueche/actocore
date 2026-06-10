import type {
  AppPlanLevel,
  CreateStudioPlanDto,
} from '@ahmedrioueche/actocore-shared';

/** Seed/admin defaults — upserted by `npm run seed:plans`. */
export type DefaultStudioPlanSeed = CreateStudioPlanDto;

export const DEPRECATED_PLAN_IDS = ['premium'] as const;

export const PAYPAL_CATALOG_PRODUCT_ID = process.env.PAYPAL_PRODUCT_ID || '';

export const DEFAULT_STUDIO_PLANS: DefaultStudioPlanSeed[] = [
  {
    planId: 'free',
    level: 'free',
    order: 0,
    name: 'Free',
    description: {
      en: 'Try ActoCore Studio',
      fr: 'Essayez ActoCore Studio',
    },
    isActive: true,
    trialDays: 14,
    pricing: { USD: { monthly: 0, yearly: 0 } },
    limits: {
      maxProjects: 1,
      maxTeamSeats: 1,
      monthlyTokenQuota: 500_000,
      maxActionsPerProject: 10,
    },
    features: ['knowledge_and_actions', 'sdk_embed'],
  },
  {
    planId: 'starter',
    level: 'starter',
    order: 1,
    name: 'Starter',
    description: {
      en: 'For small teams shipping their first assistant',
      fr: 'Pour les petites équipes qui lancent leur premier assistant',
    },
    isActive: true,
    trialDays: 0,
    pricing: { USD: { monthly: 29, yearly: 290 } },
    paypalProductId: PAYPAL_CATALOG_PRODUCT_ID,
    paypalPlanIds: {
      monthly: process.env.PAYPAL_PLAN_STARTER_MONTHLY || '',
      yearly: process.env.PAYPAL_PLAN_STARTER_YEARLY || '',
    },
    limits: {
      maxProjects: 3,
      maxTeamSeats: 5,
      monthlyTokenQuota: 5_000_000,
      maxActionsPerProject: 30,
    },
    features: ['everything_in_free', 'email_support'],
    yearlyDiscountBadge: {
      en: '2 months free',
      fr: '2 mois offerts',
    },
  },
  {
    planId: 'pro',
    level: 'pro',
    order: 2,
    name: 'Pro',
    description: {
      en: 'For growing products with higher volume',
      fr: 'Pour les produits en croissance avec un volume plus élevé',
    },
    isActive: true,
    isRecommended: true,
    trialDays: 0,
    pricing: { USD: { monthly: 79, yearly: 790 } },
    paypalProductId: PAYPAL_CATALOG_PRODUCT_ID,
    paypalPlanIds: {
      monthly: process.env.PAYPAL_PLAN_PRO_MONTHLY || '',
      yearly: process.env.PAYPAL_PLAN_PRO_YEARLY || '',
    },
    limits: {
      maxProjects: 10,
      maxTeamSeats: 20,
      monthlyTokenQuota: 50_000_000,
      maxActionsPerProject: 100,
    },
    features: ['everything_in_starter', 'priority_support'],
    yearlyDiscountBadge: {
      en: '2 months free',
      fr: '2 mois offerts',
    },
  },
  {
    planId: 'business',
    level: 'premium',
    order: 3,
    name: 'Business',
    description: {
      en: 'For high-volume teams',
      fr: 'Pour les équipes à fort volume',
    },
    isActive: true,
    trialDays: 0,
    pricing: { USD: { monthly: 199, yearly: 1990 } },
    paypalProductId: PAYPAL_CATALOG_PRODUCT_ID,
    paypalPlanIds: {
      monthly: process.env.PAYPAL_PLAN_BUSINESS_MONTHLY || '',
      yearly: process.env.PAYPAL_PLAN_BUSINESS_YEARLY || '',
    },
    limits: {
      maxProjects: 25,
      maxTeamSeats: 50,
      monthlyTokenQuota: 200_000_000,
      maxActionsPerProject: 250,
    },
    features: ['everything_in_pro', 'dedicated_support'],
    yearlyDiscountBadge: {
      en: '2 months free',
      fr: '2 mois offerts',
    },
  },
];

export const PUBLIC_PAID_PLAN_IDS = ['starter', 'pro', 'business'] as const;

export function getDefaultPlanLevels(): AppPlanLevel[] {
  return DEFAULT_STUDIO_PLANS.map((plan) => plan.level);
}
