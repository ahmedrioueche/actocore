import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudioRole } from '@ahmedrioueche/actocore-shared';
import { StudioOnboardingService } from './studio-onboarding.service';
import { StudioAccount } from './schemas/studio-account.schema';

describe('StudioOnboardingService', () => {
  const accountId = '507f1f77bcf86cd799439011';

  const accountDoc = {
    _id: { toString: () => accountId },
    onboarding: {
      completed: false,
      skipped: false,
      completedSteps: [] as string[],
      currentStep: 'welcome',
    },
    save: jest.fn().mockResolvedValue(undefined),
  };

  const accountModel = {
    findById: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(accountDoc) }),
  };

  let service: StudioOnboardingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    accountDoc.onboarding = {
      completed: false,
      skipped: false,
      completedSteps: [],
      currentStep: 'welcome',
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        StudioOnboardingService,
        { provide: getModelToken(StudioAccount.name), useValue: accountModel },
      ],
    }).compile();

    service = moduleRef.get(StudioOnboardingService);
  });

  const adminCtx = {
    accountId,
    userId: 'u1',
    role: StudioRole.USER_ADMIN,
    permissions: [],
    projectIds: [],
  };

  it('returns done state for editors', async () => {
    const state = await service.getState({
      ...adminCtx,
      role: StudioRole.USER_EDITOR,
    });
    expect(state.required).toBe(false);
    expect(state.completed).toBe(true);
    expect(state.currentStep).toBe('done');
  });

  it('advances when completeStep is sent', async () => {
    const state = await service.updateState(adminCtx, { completeStep: 'welcome' });
    expect(state.completedSteps).toContain('welcome');
    expect(state.currentStep).toBe('workspace');
  });

  it('does not auto-complete the project step when projects already exist', async () => {
    accountDoc.onboarding.completedSteps = ['welcome', 'workspace'];

    const state = await service.getState(adminCtx);
    expect(state.completedSteps).not.toContain('project');
    expect(state.currentStep).toBe('project');
    expect(accountDoc.save).not.toHaveBeenCalled();
  });
});
