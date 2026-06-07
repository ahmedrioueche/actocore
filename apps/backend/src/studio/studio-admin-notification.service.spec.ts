import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { StudioAccount } from './schemas/studio-account.schema';
import { Project } from '../projects/schemas/project.schema';
import { StudioAdminEmailsService } from './studio-admin-emails.service';
import { StudioEmailService } from './studio-email.service';
import { StudioAdminNotificationService } from './studio-admin-notification.service';

describe('StudioAdminNotificationService', () => {
  let service: StudioAdminNotificationService;
  const accountId = '507f1f77bcf86cd799439011';

  const email = { sendQuotaAlert: jest.fn() };
  const adminEmails = { resolveForAccount: jest.fn(async () => ['admin@test.local']) };

  const saveAccount = jest.fn();
  const accountDoc = {
    _id: { toString: () => accountId },
    preferences: {
      failureAlertEmails: false,
    },
    failureAlertCooldowns: {},
    save: saveAccount,
  };

  const mockAccountModel = {
    findById: jest.fn(() => ({
      exec: async () => accountDoc,
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudioAdminNotificationService,
        { provide: StudioEmailService, useValue: email },
        { provide: StudioAdminEmailsService, useValue: adminEmails },
        { provide: getModelToken(StudioAccount.name), useValue: mockAccountModel },
        { provide: getModelToken(Project.name), useValue: {} },
      ],
    }).compile();

    service = module.get(StudioAdminNotificationService);
  });

  it('does not send when failureAlertEmails is false', async () => {
    await service.maybeNotifyFailure(
      accountId,
      'billing',
      'Billing alert',
      'Payment failed',
    );

    expect(email.sendQuotaAlert).not.toHaveBeenCalled();
    expect(accountDoc.save).not.toHaveBeenCalled();
  });
});
