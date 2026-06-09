import type { StudioPlan } from '@ahmedrioueche/actocore-shared';

type RawPlanLimits = {
  maxProjects?: number;
  maxTeamSeats?: number;
  monthlyTokenQuota?: number;
  monthlyChatQuota?: number;
  maxActionsPerProject?: number;
};

function toPlainLimits(limits: unknown): RawPlanLimits {
  if (!limits || typeof limits !== 'object') {
    return {};
  }

  if (
    typeof (limits as { toObject?: () => RawPlanLimits }).toObject ===
    'function'
  ) {
    return (limits as { toObject: () => RawPlanLimits }).toObject();
  }

  return limits as RawPlanLimits;
}

/** Normalize Mongoose subdocuments / legacy fields into API-safe plan limits. */
export function normalizeStudioPlanLimits(limits: unknown): StudioPlan['limits'] {
  const plain = toPlainLimits(limits);

  return {
    maxProjects: plain.maxProjects,
    maxTeamSeats: plain.maxTeamSeats,
    monthlyTokenQuota: plain.monthlyTokenQuota ?? plain.monthlyChatQuota,
    maxActionsPerProject: plain.maxActionsPerProject,
  };
}
