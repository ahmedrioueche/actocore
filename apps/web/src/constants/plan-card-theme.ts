import type { AppPlanLevel, StudioPlan } from '@ahmedrioueche/actocore-shared';

/** Per-plan accent for card content (top bar, icon, price, checks — not card background). */
export type PlanCardTheme = {
  topBorder: string;
  buttonBg: string;
  glow: string;
  iconRing: string;
  iconColor: string;
  priceColor: string;
  checkBg: string;
  checkIcon: string;
  yearlyBadge: string;
};

export const PLAN_CARD_THEMES: Record<string, PlanCardTheme> = {
  free: {
    topBorder: 'var(--ac-color-text-muted)',
    buttonBg: 'var(--ac-color-text-muted)',
    glow: 'from-[color-mix(in_srgb,var(--ac-color-text-muted)_18%,transparent)]',
    iconRing: 'bg-surface-secondary',
    iconColor: 'text-text-muted',
    priceColor: 'text-text-primary',
    checkBg: 'bg-surface-secondary',
    checkIcon: 'text-text-muted',
    yearlyBadge: 'text-text-muted',
  },
  starter: {
    topBorder: 'var(--ac-color-primary)',
    buttonBg: 'var(--ac-color-primary)',
    glow: 'from-primary/30',
    iconRing: 'bg-primary-muted',
    iconColor: 'text-primary',
    priceColor: 'text-primary',
    checkBg: 'bg-primary-muted',
    checkIcon: 'text-primary',
    yearlyBadge: 'text-primary',
  },
  pro: {
    topBorder: 'var(--ac-color-secondary)',
    buttonBg: 'var(--ac-color-secondary)',
    glow: 'from-secondary/30',
    iconRing: 'bg-secondary/10',
    iconColor: 'text-secondary',
    priceColor: 'text-secondary',
    checkBg: 'bg-secondary/15',
    checkIcon: 'text-secondary',
    yearlyBadge: 'text-secondary',
  },
  business: {
    topBorder: 'var(--ac-color-accent)',
    buttonBg: 'var(--ac-color-accent)',
    glow: 'from-accent/30',
    iconRing: 'bg-accent/10',
    iconColor: 'text-accent',
    priceColor: 'text-accent',
    checkBg: 'bg-accent/15',
    checkIcon: 'text-accent',
    yearlyBadge: 'text-accent',
  },
};

const LEVEL_FALLBACK: Partial<Record<AppPlanLevel, keyof typeof PLAN_CARD_THEMES>> = {
  free: 'free',
  starter: 'starter',
  pro: 'pro',
  premium: 'business',
};

export function resolvePlanCardTheme(plan: StudioPlan): PlanCardTheme {
  return (
    PLAN_CARD_THEMES[plan.planId] ??
    (LEVEL_FALLBACK[plan.level]
      ? PLAN_CARD_THEMES[LEVEL_FALLBACK[plan.level]!]
      : PLAN_CARD_THEMES.starter)
  );
}

export const PLAN_CARD_CTA_CLASS =
  'w-full justify-center shadow-md transition-[filter,box-shadow,transform] duration-200 hover:brightness-110 hover:shadow-lg hover:-translate-y-px';
