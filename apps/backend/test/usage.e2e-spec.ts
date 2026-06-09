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

async function signupAndLogin(
  server: App,
  label: string,
): Promise<{ token: string; email: string }> {
  const email = `${label}-${Date.now()}@test.local`;
  await request(server)
    .post('/v1/web/auth/signup')
    .send({ accountName: `${label} Co`, email, password: 'password123' })
    .expect(201);

  const login = await request(server)
    .post('/v1/web/auth/login')
    .send({ email, password: 'password123' })
    .expect(201);

  return { token: login.body.data.accessToken as string, email };
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

  describe('tenant usage analytics', () => {
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

    it('exposes workspace and project usage for the authenticated tenant', async () => {
      const server = app.getHttpServer();
      const { token } = await signupAndLogin(server, 'usage-tenant');
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

      const workspace = await request(server)
        .get('/v1/web/usage')
        .set(auth)
        .expect(200);

      expect(workspace.body.data.totalRequests).toBeGreaterThanOrEqual(1);
      expect(workspace.body.data.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            projectId,
            projectName: 'App',
            totalRequests: expect.any(Number),
          }),
        ]),
      );

      const summary = await request(server)
        .get(`/v1/web/projects/${projectId}/usage/summary`)
        .set(auth)
        .expect(200);

      expect(summary.body.data.projectId).toBe(projectId);
      expect(summary.body.data.totalRequests).toBeGreaterThanOrEqual(1);
      for (const label of Object.keys(summary.body.data.byApiKey ?? {})) {
        expect(label).not.toMatch(/^[a-f0-9]{24}$/i);
      }

      const series = await request(server)
        .get(`/v1/web/projects/${projectId}/usage/series`)
        .set(auth)
        .expect(200);

      expect(series.body.data.projectId).toBe(projectId);
      expect(Array.isArray(series.body.data.buckets)).toBe(true);

      const breakdown = await request(server)
        .get(`/v1/web/projects/${projectId}/usage/breakdown`)
        .set(auth)
        .expect(200);

      expect(breakdown.body.data.projectId).toBe(projectId);

      const events = await request(server)
        .get(`/v1/web/projects/${projectId}/usage/events`)
        .set(auth)
        .expect(200);

      expect(events.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(events.body.data.items[0].apiKeyId).toBeUndefined();

      const quota = await request(server)
        .get('/v1/web/billing/quota')
        .set(auth)
        .expect(200);

      expect(quota.body.data.monthlyTokensUsed).toBeGreaterThanOrEqual(15);
    });

    it('isolates usage data between tenants', async () => {
      const server = app.getHttpServer();
      const tenantA = await signupAndLogin(server, 'usage-a');
      const tenantB = await signupAndLogin(server, 'usage-b');

      const projectA = await request(server)
        .post('/v1/web/projects')
        .set({ Authorization: `Bearer ${tenantA.token}` })
        .send({ name: 'Tenant A App' })
        .expect(201);

      const projectAId = projectA.body.data.id as string;
      const keyA = await request(server)
        .post('/v1/web/api-keys')
        .set({ Authorization: `Bearer ${tenantA.token}` })
        .send({ projectId: projectAId, name: 'a' })
        .expect(201);

      await request(server)
        .post('/v1/sdk/chat')
        .set({ Authorization: `Bearer ${keyA.body.data.key}` })
        .send({ message: 'hello from A' })
        .expect(201);

      await request(server)
        .get(`/v1/web/projects/${projectAId}/usage/summary`)
        .set({ Authorization: `Bearer ${tenantB.token}` })
        .expect(404);

      const workspaceB = await request(server)
        .get('/v1/web/usage')
        .set({ Authorization: `Bearer ${tenantB.token}` })
        .expect(200);

      expect(workspaceB.body.data.totalRequests).toBe(0);
      expect(
        workspaceB.body.data.projects.some(
          (row: { projectId: string }) => row.projectId === projectAId,
        ),
      ).toBe(false);
      expect(
        workspaceB.body.data.projects.every(
          (row: { totalRequests: number }) => row.totalRequests === 0,
        ),
      ).toBe(true);
    });
  });
});
