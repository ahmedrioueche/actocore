import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { applyDefaultE2eEnv } from './helpers/e2e-env';
import { seedProjectAndApiKey } from './helpers/e2e-seed';

async function createApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const application = moduleFixture.createNestApplication({ bodyParser: false });
  configureApp(application);
  await application.init();
  return application;
}

describe('Usage & quota (e2e)', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  });

  afterAll(async () => {
    await mongod.stop();
  });

  describe('SDK end-user quota message', () => {
    let app: INestApplication<App>;
    let apiKey: string;

    beforeEach(async () => {
      applyDefaultE2eEnv();
      process.env.QUOTA_ENFORCE = 'true';
      process.env.QUOTA_CHAT_PER_MINUTE = '1';
      app = await createApp();
      const seeded = await seedProjectAndApiKey(app.getHttpServer());
      apiKey = seeded.apiKey;

      await request(app.getHttpServer())
        .post('/v1/sdk/chat')
        .set({ Authorization: `Bearer ${apiKey}` })
        .send({ message: 'first' })
        .expect(201);
    });

    afterEach(async () => {
      delete process.env.QUOTA_ENFORCE;
      delete process.env.QUOTA_CHAT_PER_MINUTE;
      await app?.close();
    });

    it('returns QUOTA_EXCEEDED with a friendly message', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/sdk/chat')
        .set({ Authorization: `Bearer ${apiKey}` })
        .send({ message: 'second' });

      expect(res.status).toBe(429);
      expect(res.body.errorCode).toBe(ErrorCode.QUOTA_EXCEEDED);
      expect(res.body.message).toContain('assistant');
    });
  });

  describe('tenant billing quota (not usage analytics)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
      applyDefaultE2eEnv();
      process.env.STUDIO_AUTH_DISABLED = 'false';
      process.env.STUDIO_AUTO_VERIFY_EMAIL = 'true';
      process.env.STUDIO_JWT_SECRET = 'e2e-quota-jwt';
      process.env.STUDIO_JWT_REFRESH_SECRET = 'e2e-quota-refresh';
      process.env.STUDIO_PASSWORD_PEPPER = 'e2e-quota-pepper';
      app = await createApp();
    });

    afterEach(async () => {
      await app?.close();
    });

    it('exposes account quota for billing.read and blocks tenant usage routes', async () => {
      const server = app.getHttpServer();
      const email = `quota-${Date.now()}@test.local`;

      await request(server)
        .post('/v1/web/auth/signup')
        .send({ accountName: 'Quota Co', email, password: 'password123' })
        .expect(201);

      const login = await request(server)
        .post('/v1/web/auth/login')
        .send({ email, password: 'password123' })
        .expect(201);

      const token = login.body.data.accessToken as string;
      const auth = { Authorization: `Bearer ${token}` };

      const project = await request(server)
        .post('/v1/web/projects')
        .set(auth)
        .send({ name: 'App' })
        .expect(201);

      const projectId = project.body.data.id as string;
      const keyRes = await request(server)
        .post('/v1/web/api-keys')
        .set(auth)
        .send({ projectId, name: 'k' })
        .expect(201);

      await request(server)
        .post('/v1/sdk/chat')
        .set({ Authorization: `Bearer ${keyRes.body.data.key}` })
        .send({ message: 'hi' })
        .expect(201);

      const quota = await request(server)
        .get('/v1/web/billing/quota')
        .set(auth)
        .expect(200);

      expect(quota.body.data.monthlyChatUsed).toBeGreaterThanOrEqual(1);

      await request(server)
        .get(`/v1/web/projects/${projectId}/usage`)
        .set(auth)
        .expect(404);
    });
  });
});
