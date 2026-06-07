import type { StudioPlan } from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

export function buildPlanBullets(plan: StudioPlan, t: TFunction): string[] {
  const bullets: string[] = [];

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
  if (plan.limits.monthlyChatQuota != null) {
    bullets.push(
      t('subscription.plans.limits.chat', {
        count: plan.limits.monthlyChatQuota,
      }),
    );
  }
  if (plan.features?.length) {
    bullets.push(...plan.features);
  }

  return bullets;
}
