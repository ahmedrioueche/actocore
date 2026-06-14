import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { StudioAdminEmailsService } from '../studio/studio-admin-emails.service';
import { StudioEmailService } from '../studio/studio-email.service';
import { StudioPlanModel } from './schemas/billing.schema';
import { StudioSubscriptionNotificationService } from './studio-subscription-notification.service';

describe('StudioSubscriptionNotificationService', () => {
  let service: StudioSubscriptionNotificationService;

  const email = { sendSubscriptionEvent: jest.fn() };
  const adminEmails = {
    resolveForAccount: jest.fn(async () => ['admin@test.local']),
  };
  const planModel = {
    findOne: jest.fn(() => ({
      select: jest.fn(() => ({
        exec: async () => ({ name: 'Starter' }),
      })),
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudioSubscriptionNotificationService,
        { provide: StudioEmailService, useValue: email },
        { provide: StudioAdminEmailsService, useValue: adminEmails },
        { provide: getModelToken(StudioPlanModel.name), useValue: planModel },
      ],
    }).compile();

    service = module.get(StudioSubscriptionNotificationService);
  });

  it('sends subscription email to account admins', async () => {
    await service.notifyAccountAdmins('507f1f77bcf86cd799439011', {
      action: 'subscribed',
      planId: 'starter',
      billingCycle: 'monthly',
      periodEnd: new Date('2026-07-01T00:00:00.000Z'),
    });

    expect(email.sendSubscriptionEvent).toHaveBeenCalledWith(
      'admin@test.local',
      'Subscription active',
      expect.stringContaining('Starter'),
    );
  });

  it('does not throw when email delivery fails', async () => {
    email.sendSubscriptionEvent.mockRejectedValueOnce(new Error('Resend down'));

    await expect(
      service.notifyAccountAdmins('507f1f77bcf86cd799439011', {
        action: 'cancelled',
        planId: 'starter',
        periodEnd: new Date('2026-07-01T00:00:00.000Z'),
      }),
    ).resolves.toBeUndefined();
  });

  it('skips send when no admin recipients exist', async () => {
    adminEmails.resolveForAccount.mockResolvedValueOnce([]);

    await service.notifyAccountAdmins('507f1f77bcf86cd799439011', {
      action: 'reactivated',
      planId: 'starter',
    });

    expect(email.sendSubscriptionEvent).not.toHaveBeenCalled();
  });
});
