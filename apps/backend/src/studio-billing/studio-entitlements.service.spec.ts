import { ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { StudioEntitlementsService } from './studio-entitlements.service';

describe('StudioEntitlementsService', () => {
  const accountId = '507f1f77bcf86cd799439011';
  const projectId = '507f1f77bcf86cd799439012';

  const subscriptions = {
    getSummary: jest.fn(),
  };

  const actionModel = {
    countDocuments: jest.fn(() => ({
      exec: jest.fn(async () => 0),
    })),
  };

  let service: StudioEntitlementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptions.getSummary.mockResolvedValue({
      limits: { maxActionsPerProject: 10 },
      usage: { projectsUsed: 0, teamSeatsUsed: 0, monthlyTokensUsed: 0 },
    });
    actionModel.countDocuments.mockReturnValue({
      exec: jest.fn(async () => 10),
    });

    service = new StudioEntitlementsService(
      subscriptions as never,
      {} as never,
      actionModel as never,
      {} as never,
      { sumChatTokensThisMonthForAccount: jest.fn() } as never,
    );
  });

  it('allows action creation when under the per-project cap', async () => {
    actionModel.countDocuments.mockReturnValue({
      exec: jest.fn(async () => 9),
    });

    await expect(
      service.assertCanCreateAction(accountId, projectId),
    ).resolves.toBeUndefined();
  });

  it('blocks action creation when the per-project cap is reached', async () => {
    await expect(
      service.assertCanCreateAction(accountId, projectId),
    ).rejects.toMatchObject({
      response: {
        errorCode: ErrorCode.ACTION_LIMIT_REACHED,
        details: { limit: 10, used: 10 },
      },
    });
    await expect(
      service.assertCanCreateAction(accountId, projectId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows action creation when maxActionsPerProject is unset', async () => {
    subscriptions.getSummary.mockResolvedValue({
      limits: {},
      usage: { projectsUsed: 0, teamSeatsUsed: 0, monthlyTokensUsed: 0 },
    });
    actionModel.countDocuments.mockReturnValue({
      exec: jest.fn(async () => 100),
    });

    await expect(
      service.assertCanCreateAction(accountId, projectId),
    ).resolves.toBeUndefined();
  });

  it('allows project creation when under the project cap', async () => {
    subscriptions.getSummary.mockResolvedValue({
      limits: { maxProjects: 3 },
      usage: { projectsUsed: 2, teamSeatsUsed: 0, monthlyTokensUsed: 0 },
    });

    await expect(
      service.assertCanCreateProject(accountId),
    ).resolves.toBeUndefined();
  });

  it('blocks project creation when the project cap is reached', async () => {
    subscriptions.getSummary.mockResolvedValue({
      limits: { maxProjects: 3 },
      usage: { projectsUsed: 3, teamSeatsUsed: 0, monthlyTokensUsed: 0 },
    });

    await expect(
      service.assertCanCreateProject(accountId),
    ).rejects.toMatchObject({
      response: {
        errorCode: ErrorCode.PROJECT_LIMIT_REACHED,
        details: { limit: 3, used: 3 },
      },
    });
  });

  it('allows team invites when under the seat cap', async () => {
    subscriptions.getSummary.mockResolvedValue({
      limits: { maxTeamSeats: 5 },
      usage: { projectsUsed: 0, teamSeatsUsed: 4, monthlyTokensUsed: 0 },
    });

    await expect(
      service.assertCanAddTeamMember(accountId),
    ).resolves.toBeUndefined();
  });

  it('blocks team invites when the seat cap is reached', async () => {
    subscriptions.getSummary.mockResolvedValue({
      limits: { maxTeamSeats: 5 },
      usage: { projectsUsed: 0, teamSeatsUsed: 5, monthlyTokensUsed: 0 },
    });

    await expect(
      service.assertCanAddTeamMember(accountId),
    ).rejects.toMatchObject({
      response: {
        errorCode: ErrorCode.SEAT_LIMIT_REACHED,
        details: { limit: 5, used: 5 },
      },
    });
  });
});
