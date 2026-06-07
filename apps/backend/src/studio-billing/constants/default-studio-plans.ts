import type { AppPlanLevel, CreateStudioPlanDto } from '@ahmedrioueche/actocore-shared';

/** Seed/admin defaults — upserted by `npm run seed:plans`. */
export type DefaultStudioPlanSeed = CreateStudioPlanDto;

export const DEPRECATED_PLAN_IDS = ['premium'] as const;

export const DEFAULT_STUDIO_PLANS: DefaultStudioPlanSeed[] = [
  {
    planId: 'free',
    level: 'free',
    order: 0,
    name: 'Free',
    description: 'Try ActoCore Studio',
    isActive: true,
    trialDays: 0,
    pricing: { USD: { monthly: 0, yearly: 0 } },
    limits: { maxProjects: 1, maxTeamSeats: 1, monthlyChatQuota: 500 },
    features: [
      '1 project',
      '500 chat requests per month',
      'Knowledge base and actions',
      'SDK embed with dashboard config',
    ],
  },
  {
    planId: 'starter',
    level: 'starter',
    order: 1,
    name: 'Starter',
    description: 'For small teams shipping their first assistant',
    isActive: true,
    trialDays: 14,
    pricing: { USD: { monthly: 29, yearly: 290 } },
    paddleProductId: process.env.PADDLE_PRODUCT_STARTER || '',
    paddlePriceIds: {
      monthly: process.env.PADDLE_PRICE_STARTER_MONTHLY || '',
      yearly: process.env.PADDLE_PRICE_STARTER_YEARLY || '',
    },
    limits: { maxProjects: 3, maxTeamSeats: 5, monthlyChatQuota: 10_000 },
    features: [
      'Everything in Free',
      'Up to 3 projects',
      '5 team seats',
      '10,000 chat requests per month',
      '14-day free trial',
      'Email support',
    ],
  },
  {
    planId: 'pro',
    level: 'pro',
    order: 2,
    name: 'Pro',
    description: 'For growing products with higher volume',
    isActive: true,
    trialDays: 14,
    pricing: { USD: { monthly: 79, yearly: 790 } },
    paddleProductId: process.env.PADDLE_PRODUCT_PRO || '',
    paddlePriceIds: {
      monthly: process.env.PADDLE_PRICE_PRO_MONTHLY || '',
      yearly: process.env.PADDLE_PRICE_PRO_YEARLY || '',
    },
    limits: { maxProjects: 10, maxTeamSeats: 20, monthlyChatQuota: 100_000 },
    features: [
      'Everything in Starter',
      'Up to 10 projects',
      '20 team seats',
      '100,000 chat requests per month',
      '14-day free trial',
      'Priority support',
    ],
  },
];

export const PUBLIC_PAID_PLAN_IDS = ['starter', 'pro'] as const;

export function getDefaultPlanLevels(): AppPlanLevel[] {
  return DEFAULT_STUDIO_PLANS.map((plan) => plan.level);
}
