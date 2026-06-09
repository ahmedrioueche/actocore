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
        features: ['Email support'],
      },
      t,
    );

    expect(bullets).toEqual([
      'Email support',
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
        features: [
          'Knowledge base and actions',
          'SDK embed with dashboard config',
        ],
      },
      t,
    );

    expect(bullets.slice(0, 3)).toEqual([
      'Knowledge base and actions',
      'SDK embed with dashboard config',
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
        features: ['Everything in Free', 'Email support'],
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
      'Everything in Free',
      '5M chats',
      '3 projects',
      '5 seats',
      'Email support',
      '30 actions per project',
    ]);
  });
});
