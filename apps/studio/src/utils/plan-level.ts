import type { AppPlanLevel } from '@ahmedrioueche/actocore-shared';

const LEVEL_RANK: Record<AppPlanLevel, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  premium: 3,
};

export function comparePlanLevel(
  current: AppPlanLevel,
  target: AppPlanLevel,
): number {
  return LEVEL_RANK[target] - LEVEL_RANK[current];
}

export function isUpgrade(
  current: AppPlanLevel,
  target: AppPlanLevel,
): boolean {
  return comparePlanLevel(current, target) > 0;
}
