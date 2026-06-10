import {
  STUDIO_PLAN_TIER_INHERITANCE_PREFIX,
  type StudioPlan,
  type StudioPlanFeatureId,
} from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

import { formatTokenCount } from '@/utils/format-token-count';

function isTierInheritanceFeature(id: StudioPlanFeatureId): boolean {
  return id.startsWith(STUDIO_PLAN_TIER_INHERITANCE_PREFIX);
}

function translateFeature(id: StudioPlanFeatureId, t: TFunction): string {
  return t(`subscription.plans.features.${id}`);
}

function partitionFeatures(features: StudioPlanFeatureId[]): {
  tierInheritance: StudioPlanFeatureId[];
  other: StudioPlanFeatureId[];
} {
  const tierInheritance: StudioPlanFeatureId[] = [];
  const other: StudioPlanFeatureId[] = [];

  for (const feature of features) {
    if (isTierInheritanceFeature(feature)) {
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
    bullets.push(...tierInheritance.map((id) => translateFeature(id, t)));
    if (tokenBullet) {
      bullets.push(tokenBullet);
    }
    pushProjectAndSeatBullets(bullets, plan, t);
    bullets.push(...other.map((id) => translateFeature(id, t)));
  } else {
    bullets.push(...features.map((id) => translateFeature(id, t)));
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
