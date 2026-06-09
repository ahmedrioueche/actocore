import type { StudioPlan } from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

import { formatTokenCount } from '@/utils/format-token-count';

const TIER_INHERITANCE_FEATURE = /^everything in /i;

function partitionFeatures(features: string[]): {
  tierInheritance: string[];
  other: string[];
} {
  const tierInheritance: string[] = [];
  const other: string[] = [];

  for (const feature of features) {
    if (TIER_INHERITANCE_FEATURE.test(feature.trim())) {
      tierInheritance.push(feature);
    } else {
      other.push(feature);
    }
  }

  return { tierInheritance, other };
}

function pushProjectAndSeatBullets(
  bullets: string[],
  plan: StudioPlan,
  t: TFunction,
): void {
  if (plan.limits.maxProjects != null) {
    bullets.push(
      t('subscription.plans.limits.projects', {
        count: plan.limits.maxProjects,
      }),
    );
  }
  if (plan.limits.maxTeamSeats != null) {
    bullets.push(
      t('subscription.plans.limits.seats', {
        count: plan.limits.maxTeamSeats,
      }),
    );
  }
}

export function buildPlanBullets(plan: StudioPlan, t: TFunction): string[] {
  const bullets: string[] = [];
  const features = plan.features ?? [];
  const { tierInheritance, other } = partitionFeatures(features);

  const tokenBullet =
    plan.limits.monthlyTokenQuota != null
      ? t('subscription.plans.limits.chat', {
          count: formatTokenCount(plan.limits.monthlyTokenQuota),
        })
      : null;

  if (tierInheritance.length > 0) {
    bullets.push(...tierInheritance);
    if (tokenBullet) {
      bullets.push(tokenBullet);
    }
    pushProjectAndSeatBullets(bullets, plan, t);
    bullets.push(...other);
  } else {
    bullets.push(...features);
    if (tokenBullet) {
      bullets.push(tokenBullet);
    }
    pushProjectAndSeatBullets(bullets, plan, t);
  }

  if (plan.limits.maxActionsPerProject != null) {
    bullets.push(
      t('subscription.plans.limits.actionsPerProject', {
        count: plan.limits.maxActionsPerProject,
      }),
    );
  }

  return bullets;
}
