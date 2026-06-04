import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Project } from '../projects/schemas/project.schema';
import { StudioAccount } from '../studio/schemas/studio-account.schema';
import { StudioMembership } from '../studio/schemas/studio-membership.schema';
import {
  StudioPlanModel,
  StudioSubscriptionHistoryModel,
  StudioSubscriptionModel,
} from './schemas/billing.schema';
import { StudioPaddleService } from './studio-paddle.service';
import { StudioPlansService } from './studio-plans.service';
import { StudioSubscriptionService } from './studio-subscription.service';
import { UsageService } from '../usage/usage.service';

const accountId = new Types.ObjectId().toString();
const paddleSubId = 'sub_paddle_test_001';
const txnId = 'txn_paddle_test_001';

const starterPlan = {
  planId: 'starter',
  level: 'starter',
  name: 'Starter',
  isActive: true,
  trialDays: 0,
  pricing: { USD: { monthly: 29 } },
  limits: { maxProjects: 3 },
};

describe('StudioSubscriptionService idempotency', () => {
  const subscriptions: Array<Record<string, unknown>> = [];
  const history: Array<Record<string, unknown>> = [];

  const subscriptionModel = {
    findOne: jest.fn((query: { paddleSubscriptionId?: string; accountId?: unknown }) => ({
      exec: async () => {
        if (query.paddleSubscriptionId) {
          return (
            subscriptions.find(
              (s) => s.paddleSubscriptionId === query.paddleSubscriptionId,
            ) ?? null
          );
        }
        return null;
      },
    })),
    create: jest.fn(async (doc: Record<string, unknown>) => {
      if (
        subscriptions.some(
          (s) => s.paddleSubscriptionId === doc.paddleSubscriptionId,
        )
      ) {
        const err = new Error('duplicate sub') as Error & { code: number };
        err.code = 11000;
        throw err;
      }
      const row = {
        _id: new Types.ObjectId(),
        ...doc,
        currentPeriodStart: doc.currentPeriodStart ?? new Date(),
        currentPeriodEnd: doc.currentPeriodEnd ?? new Date(),
        status: doc.status ?? 'active',
      };
      subscriptions.push(row);
      return row;
    }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    exists: jest.fn(() => ({ exec: async () => false })),
    findById: jest.fn(),
  };

  const historyModel = {
    exists: jest.fn((query: { providerTransactionId?: string }) => ({
      exec: async () => {
        if (query.providerTransactionId) {
          return history.some(
            (h) => h.providerTransactionId === query.providerTransactionId,
          );
        }
        return false;
      },
    })),
    create: jest.fn(async (doc: Record<string, unknown>) => {
      if (
        doc.providerTransactionId &&
        history.some((h) => h.providerTransactionId === doc.providerTransactionId)
      ) {
        const err = new Error('duplicate txn') as Error & { code: number };
        err.code = 11000;
        throw err;
      }
      history.push(doc);
      return doc;
    }),
    find: jest.fn().mockReturnValue({ sort: () => ({ limit: () => ({ exec: async () => [] }) }) }),
  };

  const planModel = {
    findOne: jest.fn().mockReturnValue({
      exec: async () => ({ ...starterPlan, _id: new Types.ObjectId() }),
    }),
  };

  const plansService = {
    getByPlanId: jest.fn(async () => ({
      ...starterPlan,
      planId: 'starter',
      isActive: true,
      name: 'Starter',
      trialDays: 0,
      _id: new Types.ObjectId(),
    })),
    toPlan: jest.fn((doc: typeof starterPlan & { _id?: Types.ObjectId }) => ({
      id: doc._id?.toString() ?? 'plan-id',
      ...starterPlan,
      createdAt: new Date().toISOString(),
      limits: starterPlan.limits,
    })),
    findByPaddlePriceId: jest.fn(),
  };

  let service: StudioSubscriptionService;

  beforeEach(async () => {
    subscriptions.length = 0;
    history.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudioSubscriptionService,
        { provide: getModelToken(StudioSubscriptionModel.name), useValue: subscriptionModel },
        { provide: getModelToken(StudioSubscriptionHistoryModel.name), useValue: historyModel },
        { provide: getModelToken(StudioPlanModel.name), useValue: planModel },
        {
          provide: getModelToken(StudioAccount.name),
          useValue: { findById: () => ({ exec: async () => ({ _id: accountId, save: jest.fn() }) }) },
        },
        {
          provide: getModelToken(StudioMembership.name),
          useValue: { countDocuments: () => ({ exec: async () => 1 }) },
        },
        {
          provide: getModelToken(Project.name),
          useValue: { find: () => ({ select: () => ({ exec: async () => [] }) }) },
        },
        { provide: StudioPlansService, useValue: plansService },
        {
          provide: UsageService,
          useValue: {
            countChatRequestsThisMonthForAccount: jest.fn().mockResolvedValue(0),
          },
        },
        { provide: StudioPaddleService, useValue: {} },
      ],
    }).compile();

    service = module.get(StudioSubscriptionService);
  });

  const txnPayload = {
    transactionId: txnId,
    paddleSubscriptionId: paddleSubId,
    customData: {
      accountId,
      planId: 'starter',
      billingCycle: 'monthly' as const,
    },
    paddleCustomerId: 'ctm_123',
    currency: 'USD',
    amountPaid: 29,
  };

  it('handlePaddleTransactionCompleted is idempotent for duplicate txn', async () => {
    await service.handlePaddleTransactionCompleted(txnPayload);
    await service.handlePaddleTransactionCompleted(txnPayload);

    expect(subscriptions).toHaveLength(1);
    const payments = history.filter((h) => h.providerTransactionId);
    expect(payments).toHaveLength(1);
    expect(payments[0].providerTransactionId).toBe(txnId);
  });

  it('records payment when subscription exists but txn is new', async () => {
    subscriptions.push({
      _id: new Types.ObjectId(),
      accountId: new Types.ObjectId(accountId),
      planId: 'starter',
      paddleSubscriptionId: paddleSubId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      status: 'active',
    });

    await service.handlePaddleTransactionCompleted({
      ...txnPayload,
      transactionId: 'txn_second',
    });

    expect(subscriptions).toHaveLength(1);
    const payments = history.filter((h) => h.providerTransactionId);
    expect(payments).toHaveLength(1);
    expect(payments[0].providerTransactionId).toBe('txn_second');
  });

  it('marks trial converted when payment is collected during trialing', async () => {
    const subOid = new Types.ObjectId();
    subscriptions.push({
      _id: subOid,
      accountId: new Types.ObjectId(accountId),
      planId: 'starter',
      paddleSubscriptionId: paddleSubId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 86_400_000),
      status: 'trialing',
      trial: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 86_400_000),
        hasUsedTrial: true,
      },
      save: jest.fn(async function (this: Record<string, unknown>) {
        return this;
      }),
    });

    await service.handlePaddleTransactionCompleted({
      ...txnPayload,
      amountPaid: 29,
    });

    const sub = subscriptions.find((s) => s.paddleSubscriptionId === paddleSubId);
    expect(sub?.status).toBe('active');
    expect(
      (sub?.trial as { convertedToPaid?: boolean } | undefined)?.convertedToPaid,
    ).toBe(true);
  });
});
