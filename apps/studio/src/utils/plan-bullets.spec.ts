import { describe, expect, it, vi } from 'vitest';

import type { StudioPlan } from '@ahmedrioueche/actocore-shared';

import { buildPlanBullets } from './plan-bullets';

const t = vi.fn((key: string, options?: Record<string, unknown>) => {
  if (key === 'subscription.plans.limits.projects') {
    return `${options?.count} projects`;
  }
  if (key === 'subscription.plans.limits.seats') {
    return `${options?.count} seats`;
  }
  if (key === 'subscription.plans.limits.chat') {
    return `${options?.count} chats`;
  }
  return key;
});

const basePlan: StudioPlan = {
  id: '1',
  planId: 'free',
  level: 'free',
  name: 'Free',
  pricing: { USD: { monthly: 0, yearly: 0 } },
  limits: {
    maxProjects: 1,
    maxTeamSeats: 1,
    monthlyChatQuota: 500,
  },
  createdAt: new Date().toISOString(),
};

describe('buildPlanBullets', () => {
  it('builds limit bullets and appends marketing features', () => {
    const bullets = buildPlanBullets(
      {
        ...basePlan,
        trialDays: 14,
        features: ['Email support'],
      },
      t,
    );

    expect(bullets).toEqual([
      '1 projects',
      '1 seats',
      '500 chats',
      'Email support',
    ]);
  });

  it('omits trial bullet on paid plans', () => {
    const bullets = buildPlanBullets(
      {
        ...basePlan,
        planId: 'starter',
        level: 'starter',
        trialDays: 0,
        limits: { maxProjects: 3, maxTeamSeats: 5, monthlyChatQuota: 10_000 },
      },
      t,
    );

    expect(bullets[0]).toBe('3 projects');
  });
});
