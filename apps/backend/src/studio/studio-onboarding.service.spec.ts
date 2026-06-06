import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudioRole } from '@ahmedrioueche/actocore-shared';
import { StudioOnboardingService } from './studio-onboarding.service';
import { StudioAccount } from './schemas/studio-account.schema';
import { Project } from '../projects/schemas/project.schema';

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

  const projectModel = {
    countDocuments: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
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
        { provide: getModelToken(Project.name), useValue: projectModel },
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

  it('auto-completes project step when a project exists', async () => {
    projectModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    const state = await service.getState(adminCtx);
    expect(state.completedSteps).toContain('project');
    expect(accountDoc.save).toHaveBeenCalled();
  });
});
