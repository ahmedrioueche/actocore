import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Types } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import {
  StudioPaddleWebhookEventModel,
  StudioSubscriptionHistoryModel,
  StudioSubscriptionModel,
} from '../src/studio-billing/schemas/billing.schema';
import { StudioSubscriptionService } from '../src/studio-billing/studio-subscription.service';
import { seedStudioPlansForE2e } from './helpers/studio-billing-e2e';

describe('Studio billing Paddle idempotency (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.STUDIO_AUTH_DISABLED = 'false';
    process.env.STUDIO_AUTO_VERIFY_EMAIL = 'true';
    process.env.STUDIO_JWT_SECRET = 'e2e-studio-jwt-secret';
    process.env.STUDIO_JWT_REFRESH_SECRET = 'e2e-studio-refresh-secret';
    process.env.STUDIO_PASSWORD_PEPPER = 'e2e-studio-password-pepper';
    process.env.PADDLE_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.QUOTA_ENFORCE = 'false';
    process.env.LLM_PROVIDER = 'stub';
    delete process.env.REDIS_URL;

    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  });

  afterAll(async () => {
    await mongod?.stop();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();
    await seedStudioPlansForE2e(app);
  });

  afterEach(async () => {
    await app?.close();
  });

  function signWebhook(body: string, secret: string): string {
    const ts = Math.floor(Date.now() / 1000);
    const h1 = crypto.createHmac('sha256', secret).update(`${ts}:${body}`).digest('hex');
    return `ts=${ts};h1=${h1}`;
  }

  function postPaddleWebhook(body: string) {
    const signature = signWebhook(body, process.env.PADDLE_WEBHOOK_SECRET!);
    return request(app.getHttpServer())
      .post('/v1/web/billing/paddle/webhook')
      .set('Content-Type', 'application/json')
      .set('paddle-signature', signature)
      .send(body);
  }

  it('ignores duplicate Paddle event_id on webhook retry', async () => {
    const eventId = `evt_${Date.now()}`;
    const payload = {
      event_id: eventId,
      event_type: 'subscription.updated',
      data: {
        id: 'sub_e2e_dup_only',
        status: 'active',
        items: [{ price: { id: 'pri_test', billing_cycle: { interval: 'month' } } }],
      },
    };
    const body = JSON.stringify(payload);

    await postPaddleWebhook(body).expect(200);
    await postPaddleWebhook(body).expect(200);

    const webhookModel = app.get(getModelToken(StudioPaddleWebhookEventModel.name));
    const eventCount = await webhookModel.countDocuments({ eventId }).exec();
    expect(eventCount).toBe(1);
  });

  it('creates one subscription and one payment row for duplicate transaction.completed', async () => {
    const server = app.getHttpServer();
    const email = `billing-${Date.now()}@test.local`;
    const paddleSubId = `sub_e2e_${Date.now()}`;
    const txnId = `txn_e2e_${Date.now()}`;

    await request(server)
      .post('/v1/web/auth/signup')
      .send({ accountName: 'Billing Co', email, password: 'password123' })
      .expect(201);

    const login = await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    const accessToken = login.body.data.accessToken as string;
    const jwtPayload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
    ) as { aid: string };
    const accountId = jwtPayload.aid;

    const eventId = `evt_txn_${Date.now()}`;
    const payload = {
      event_id: eventId,
      event_type: 'transaction.completed',
      data: {
        id: txnId,
        subscription_id: paddleSubId,
        customer_id: 'ctm_e2e',
        currency_code: 'USD',
        custom_data: { accountId, planId: 'starter', billingCycle: 'monthly' },
        details: { totals: { total: '2900' } },
      },
    };
    const body = JSON.stringify(payload);

    await postPaddleWebhook(body).expect(200);

    const eventId2 = `evt_txn_retry_${Date.now()}`;
    const retryPayload = { ...JSON.parse(body), event_id: eventId2 };
    const retryBody = JSON.stringify(retryPayload);
    await postPaddleWebhook(retryBody).expect(200);

    const subModel = app.get(getModelToken(StudioSubscriptionModel.name));
    const subs = await subModel.countDocuments({ paddleSubscriptionId: paddleSubId }).exec();
    expect(subs).toBe(1);

    const historyModel = app.get(getModelToken(StudioSubscriptionHistoryModel.name));
    const payments = await historyModel
      .countDocuments({ providerTransactionId: txnId })
      .exec();
    expect(payments).toBe(1);
  });

  it('deduplicates payment history by providerTransactionId (service)', async () => {
    const subModel = app.get(getModelToken(StudioSubscriptionModel.name));
    const historyModel = app.get(getModelToken(StudioSubscriptionHistoryModel.name));
    const accountOid = new Types.ObjectId();

    await subModel.create({
      accountId: accountOid,
      planId: 'starter',
      startDate: new Date(),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
      status: 'active',
      provider: 'paddle',
      paddleSubscriptionId: 'sub_pay_dup',
      billingCycle: 'monthly',
      autoRenew: true,
    });

    const subscriptionService = app.get(StudioSubscriptionService);
    const payload = {
      transactionId: 'txn_pay_dup_1',
      paddleSubscriptionId: 'sub_pay_dup',
      customData: { accountId: accountOid.toString(), planId: 'starter' },
      amountPaid: 29,
      currency: 'USD',
    };

    await subscriptionService.handlePaddleTransactionCompleted(payload);
    await subscriptionService.handlePaddleTransactionCompleted(payload);

    const count = await historyModel
      .countDocuments({ providerTransactionId: 'txn_pay_dup_1' })
      .exec();
    expect(count).toBe(1);
  });
});
