import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { QuotaAlertService } from './quota-alert.service';
import { StudioAccount } from '../studio/schemas/studio-account.schema';
import { StudioAdminEmailsService } from '../studio/studio-admin-emails.service';
import { StudioEmailService } from '../studio/studio-email.service';
import { StudioQuotaWebhookService } from '../studio/studio-quota-webhook.service';
import { StudioEntitlementsService } from '../studio-billing/studio-entitlements.service';

describe('QuotaAlertService', () => {
  let service: QuotaAlertService;
  const accountId = '507f1f77bcf86cd799439011';

  const email = { sendQuotaAlert: jest.fn() };
  const quotaWebhook = { notifyThreshold: jest.fn() };
  const adminEmails = { resolveForAccount: jest.fn(async () => ['admin@test.local']) };
  const entitlements = {
    resolveMonthlyTokenQuota: jest.fn(async () => 100),
    countAccountMonthlyTokenUsage: jest.fn(async () => 90),
  };

  const saveAccount = jest.fn();
  const accountDoc = {
    _id: { toString: () => accountId },
    name: 'Acme',
    preferences: {
      quotaWarningEmails: false,
      quotaExhaustedEmails: true,
    },
    quotaAlerts: {
      monthKey: '2099-01',
      warned80: false,
      warned90: false,
      warned100: false,
    },
    save: saveAccount,
  };

  const mockAccountModel = {
    findById: jest.fn(() => ({
      exec: async () => accountDoc,
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    accountDoc.quotaAlerts = {
      monthKey: `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`,
      warned80: false,
      warned90: false,
      warned100: false,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaAlertService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => ({
              enabled: true,
              tokensPerMonth: 100,
              alertPercentages: [80, 90, 100],
            }),
          },
        },
        { provide: StudioEmailService, useValue: email },
        { provide: StudioAdminEmailsService, useValue: adminEmails },
        { provide: StudioQuotaWebhookService, useValue: quotaWebhook },
        { provide: StudioEntitlementsService, useValue: entitlements },
        { provide: getModelToken(StudioAccount.name), useValue: mockAccountModel },
      ],
    }).compile();

    service = module.get(QuotaAlertService);
  });

  it('skips warning emails when quotaWarningEmails is false', async () => {
    await service.maybeNotifyMonthlyThresholds(accountId);

    expect(accountDoc.quotaAlerts?.warned90).toBe(true);
    expect(email.sendQuotaAlert).not.toHaveBeenCalled();
    expect(quotaWebhook.notifyThreshold).not.toHaveBeenCalled();
  });
});
