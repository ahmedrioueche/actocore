import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { StudioPlanModel } from '../studio-billing/schemas/billing.schema';
import { StudioAccount } from './schemas/studio-account.schema';
import { StudioEmailService } from './studio-email.service';
import { StudioPlatformNotificationService } from './studio-platform-notification.service';

describe('StudioPlatformNotificationService', () => {
  let service: StudioPlatformNotificationService;

  const email = { sendPlatformActivity: jest.fn(async () => undefined) };
  const accountModel = {
    findById: jest.fn(() => ({
      select: jest.fn(() => ({
        exec: async () => ({ name: 'Acme Workspace' }),
      })),
    })),
  };
  const planModel = {
    findOne: jest.fn(() => ({
      select: jest.fn(() => ({
        exec: async () => ({ name: 'Pro' }),
      })),
    })),
  };

  const config = {
    getOrThrow: jest.fn(() => ({
      platformNotifyEnabled: true,
      platformNotifyEmail: 'owner@actocore.test',
      studioAppUrl: 'https://studio.example',
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudioPlatformNotificationService,
        { provide: StudioEmailService, useValue: email },
        { provide: ConfigService, useValue: config },
        { provide: getModelToken(StudioAccount.name), useValue: accountModel },
        { provide: getModelToken(StudioPlanModel.name), useValue: planModel },
      ],
    }).compile();

    service = module.get(StudioPlatformNotificationService);
  });

  it('sends signup notification to platform inbox', async () => {
    service.notifyUserSignup({
      email: 'user@example.com',
      displayName: 'Jane',
      accountName: 'Acme',
      accountId: 'acc-1',
      method: 'email',
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(email.sendPlatformActivity).toHaveBeenCalledWith(
      'owner@actocore.test',
      'New user signup',
      expect.arrayContaining([
        'Method: Email & password',
        'Email: user@example.com',
      ]),
    );
  });

  it('skips test account signups', async () => {
    service.notifyUserSignup({
      email: 'demo1@actocore.test',
      accountName: 'Demo',
      accountId: 'acc-demo',
      method: 'email',
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(email.sendPlatformActivity).not.toHaveBeenCalled();
  });

  it('sends project created notification', async () => {
    service.notifyProjectCreated({
      projectId: 'proj-1',
      projectName: 'My App',
      accountId: 'acc-1',
      createdByEmail: 'user@example.com',
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(email.sendPlatformActivity).toHaveBeenCalledWith(
      'owner@actocore.test',
      'New project created',
      expect.arrayContaining(['Project: My App', 'Project ID: proj-1']),
    );
  });

  it('skips playground projects', async () => {
    service.notifyProjectCreated({
      projectId: 'proj-play',
      projectName: 'Playground',
      accountId: 'playground',
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(email.sendPlatformActivity).not.toHaveBeenCalled();
  });

  it('sends subscription notification with workspace context', async () => {
    service.notifySubscriptionEvent('507f1f77bcf86cd799439011', {
      action: 'subscribed',
      planId: 'pro',
      billingCycle: 'monthly',
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(email.sendPlatformActivity).toHaveBeenCalledWith(
      'owner@actocore.test',
      'New subscription',
      expect.arrayContaining([
        'Workspace: Acme Workspace',
        'Plan: Pro',
        'Event: Subscription activated',
      ]),
    );
  });
});
