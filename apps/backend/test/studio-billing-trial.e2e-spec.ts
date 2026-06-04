import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { StudioSubscriptionModel } from '../src/studio-billing/schemas/billing.schema';
import { seedStudioPlansForE2e } from './helpers/studio-billing-e2e';

describe('Studio billing free trial (e2e)', () => {
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

  async function loginAdmin(): Promise<string> {
    const server = app.getHttpServer();
    const email = `trial-${Date.now()}@test.local`;
    await request(server)
      .post('/v1/web/auth/signup')
      .send({ accountName: 'Trial Co', email, password: 'password123' })
      .expect(201);
    const login = await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);
    return login.body.data.accessToken as string;
  }

  it('starts internal free trial and blocks a second trial', async () => {
    const token = await loginAdmin();
    const server = app.getHttpServer();

    const eligibility = await request(server)
      .get('/v1/web/billing/trial/eligibility')
      .query({ planId: 'starter' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(eligibility.body.data.eligible).toBe(true);
    expect(eligibility.body.data.trialDays).toBeGreaterThan(0);

    const started = await request(server)
      .post('/v1/web/billing/trial/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ planId: 'starter', billingCycle: 'monthly' })
      .expect(201);

    expect(started.body.data.status).toBe('trialing');
    expect(started.body.data.trial?.hasUsedTrial).toBe(true);

    const summary = await request(server)
      .get('/v1/web/billing/subscription')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(summary.body.data.trial?.isTrialing).toBe(true);
    expect(summary.body.data.limits.maxProjects).toBe(3);

    await request(server)
      .post('/v1/web/billing/trial/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ planId: 'starter' })
      .expect(400)
      .expect((res) => {
        expect(res.body.errorCode).toBe(ErrorCode.TRIAL_NOT_ELIGIBLE);
      });

    const subModel = app.get(getModelToken(StudioSubscriptionModel.name));
    const count = await subModel.countDocuments({ status: 'trialing' }).exec();
    expect(count).toBe(1);
  });
});
