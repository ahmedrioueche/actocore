import { normalizeStudioPlanLimits } from './studio-plan-limits.util';

describe('normalizeStudioPlanLimits', () => {
  it('extracts limits from a Mongoose subdocument', () => {
    const limits = {
      toObject: () => ({
        maxProjects: 3,
        maxTeamSeats: 5,
        monthlyTokenQuota: 5_000_000,
        maxActionsPerProject: 30,
      }),
      monthlyTokenQuota: 5_000_000,
    };

    expect(normalizeStudioPlanLimits(limits)).toEqual({
      maxProjects: 3,
      maxTeamSeats: 5,
      monthlyTokenQuota: 5_000_000,
      maxActionsPerProject: 30,
    });
  });

  it('maps legacy monthlyChatQuota to monthlyTokenQuota', () => {
    expect(
      normalizeStudioPlanLimits({
        maxProjects: 1,
        monthlyChatQuota: 500_000,
      }),
    ).toEqual({
      maxProjects: 1,
      maxTeamSeats: undefined,
      monthlyTokenQuota: 500_000,
      maxActionsPerProject: undefined,
    });
  });
});
