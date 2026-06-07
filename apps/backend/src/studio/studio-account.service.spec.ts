import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { StudioRole } from '@ahmedrioueche/actocore-shared';
import { StudioAccount } from './schemas/studio-account.schema';
import { StudioAccountService } from './studio-account.service';
import type { StudioRequestContext } from './studio-context';

describe('StudioAccountService', () => {
  let service: StudioAccountService;
  const accountId = '507f1f77bcf86cd799439011';

  const accountDoc = {
    _id: { toString: () => accountId },
    name: 'Acme',
    preferences: {
      quotaAlertEmails: true,
      quotaWarningEmails: true,
      quotaExhaustedEmails: true,
      failureAlertEmails: true,
      billingEmails: true,
      productEmails: false,
    },
    save: jest.fn(async function (this: typeof accountDoc) {
      return this;
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockModel = {
    findById: jest.fn(() => ({
      exec: async () => accountDoc,
    })),
  };

  const adminCtx: StudioRequestContext = {
    userId: 'u1',
    accountId,
    email: 'a@test.local',
    role: StudioRole.USER_ADMIN,
    permissions: ['project.write'],
    projectIds: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudioAccountService,
        { provide: getModelToken(StudioAccount.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get(StudioAccountService);
  });

  it('returns account settings', async () => {
    const data = await service.getSettings(adminCtx);
    expect(data.name).toBe('Acme');
    expect(data.preferences.quotaWarningEmails).toBe(true);
    expect(data.preferences.failureAlertEmails).toBe(true);
  });

  it('blocks editors from updating account', async () => {
    await expect(
      service.updateSettings(
        { ...adminCtx, role: StudioRole.USER_EDITOR },
        { name: 'X' },
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
