import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Types } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import {
  StudioPayPalWebhookEventModel,
  StudioSubscriptionHistoryModel,
  StudioSubscriptionModel,
} from '../src/studio-billing/schemas/billing.schema';
import { StudioSubscriptionService } from '../src/studio-billing/studio-subscription.service';
import { encodePayPalCustomId } from '../src/studio-billing/utils/paypal-custom-id.util';
import { seedStudioPlansForE2e } from './helpers/studio-billing-e2e';

describe('Studio billing PayPal idempotency (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.STUDIO_AUTH_DISABLED = 'false';
    process.env.STUDIO_AUTO_VERIFY_EMAIL = 'true';
    process.env.STUDIO_JWT_SECRET = 'e2e-studio-jwt-secret';
    process.env.STUDIO_JWT_REFRESH_SECRET = 'e2e-studio-refresh-secret';
    process.env.STUDIO_PASSWORD_PEPPER = 'e2e-studio-password-pepper';
    process.env.QUOTA_ENFORCE = 'false';
    process.env.LLM_PROVIDER = 'stub';
    delete process.env.REDIS_URL;
    delete process.env.PAYPAL_WEBHOOK_ID;

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

  function postPayPalWebhook(payload: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post('/v1/web/billing/paypal/webhook')
      .set('Content-Type', 'application/json')
      .send(payload);
  }

  it('ignores duplicate PayPal event id on webhook retry', async () => {
    const eventId = `WH-${Date.now()}`;
    const payload = {
      id: eventId,
      event_type: 'BILLING.SUBSCRIPTION.UPDATED',
      resource: {
        id: 'I-E2E-DUP-ONLY',
        status: 'ACTIVE',
        plan_id: 'P-TEST-STARTER-MONTHLY',
      },
    };

    await postPayPalWebhook(payload).expect(200);
    await postPayPalWebhook(payload).expect(200);

    const webhookModel = app.get(getModelToken(StudioPayPalWebhookEventModel.name));
    const eventCount = await webhookModel.countDocuments({ eventId }).exec();
    expect(eventCount).toBe(1);
  });

  it('creates one subscription for duplicate PAYMENT.SALE.COMPLETED', async () => {
    const server = app.getHttpServer();
    const email = `billing-${Date.now()}@test.local`;
    const paypalSubId = `I-E2E-${Date.now()}`;
    const txnId = `TXN-E2E-${Date.now()}`;

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

    await postPayPalWebhook({
      id: `WH-ACTIVATE-${Date.now()}`,
      event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
      resource: {
        id: paypalSubId,
        status: 'ACTIVE',
        plan_id: 'P-TEST-STARTER-MONTHLY',
        custom_id: encodePayPalCustomId({
          accountId,
          planId: 'starter',
          billingCycle: 'monthly',
        }),
        billing_info: {
          next_billing_time: new Date(Date.now() + 86_400_000 * 30).toISOString(),
        },
      },
    }).expect(200);

    const paymentPayload = {
      id: `WH-PAY-${Date.now()}`,
      event_type: 'PAYMENT.SALE.COMPLETED',
      resource: {
        id: txnId,
        billing_agreement_id: paypalSubId,
        amount: { total: '29.00', currency: 'USD' },
      },
    };

    await postPayPalWebhook(paymentPayload).expect(200);
    await postPayPalWebhook({
      ...paymentPayload,
      id: `WH-PAY-RETRY-${Date.now()}`,
    }).expect(200);

    const subModel = app.get(getModelToken(StudioSubscriptionModel.name));
    const subs = await subModel
      .countDocuments({ paypalSubscriptionId: paypalSubId })
      .exec();
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
      provider: 'paypal',
      paypalSubscriptionId: 'I-PAY-DUP',
      billingCycle: 'monthly',
      autoRenew: true,
    });

    const subscriptionService = app.get(StudioSubscriptionService);
    const payload = {
      paypalSubscriptionId: 'I-PAY-DUP',
      transactionId: 'TXN-PAY-DUP-1',
      amountPaid: 29,
      currency: 'USD',
    };

    await subscriptionService.handlePayPalPaymentCompleted(payload);
    await subscriptionService.handlePayPalPaymentCompleted(payload);

    const count = await historyModel
      .countDocuments({ providerTransactionId: 'TXN-PAY-DUP-1' })
      .exec();
    expect(count).toBe(1);
  });
});
