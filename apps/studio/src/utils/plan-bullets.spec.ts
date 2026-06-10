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
  if (key === 'subscription.plans.limits.actionsPerProject') {
    return `${options?.count} actions per project`;
  }
  if (key.startsWith('subscription.plans.features.')) {
    return key.replace('subscription.plans.features.', '');
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
    monthlyTokenQuota: 500_000,
    maxActionsPerProject: 10,
  },
  createdAt: new Date().toISOString(),
};

describe('buildPlanBullets', () => {
  it('lists tier inheritance, then tokens, then other features and limits', () => {
    const bullets = buildPlanBullets(
      {
        ...basePlan,
        trialDays: 14,
        features: ['email_support'],
      },
      t,
    );

    expect(bullets).toEqual([
      'email_support',
      '500K chats',
      '1 projects',
      '1 seats',
      '10 actions per project',
    ]);
  });

  it('keeps product features before tokens on the free tier', () => {
    const bullets = buildPlanBullets(
      {
        ...basePlan,
        features: ['knowledge_and_actions', 'sdk_embed'],
      },
      t,
    );

    expect(bullets.slice(0, 3)).toEqual([
      'knowledge_and_actions',
      'sdk_embed',
      '500K chats',
    ]);
  });

  it('puts token quota before support features on paid tiers', () => {
    const bullets = buildPlanBullets(
      {
        ...basePlan,
        planId: 'starter',
        level: 'starter',
        trialDays: 0,
        features: ['everything_in_free', 'email_support'],
        limits: {
          maxProjects: 3,
          maxTeamSeats: 5,
          monthlyTokenQuota: 5_000_000,
          maxActionsPerProject: 30,
        },
      },
      t,
    );

    expect(bullets).toEqual([
      'everything_in_free',
      '5M chats',
      '3 projects',
      '5 seats',
      'email_support',
      '30 actions per project',
    ]);
  });
});
