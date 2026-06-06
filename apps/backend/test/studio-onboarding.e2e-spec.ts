import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';

describe('Studio onboarding (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.STUDIO_AUTH_DISABLED = 'false';
    process.env.STUDIO_AUTO_VERIFY_EMAIL = 'true';
    process.env.STUDIO_DEFAULT_PROJECT_ON_SIGNUP = 'false';
    process.env.STUDIO_JWT_SECRET = 'e2e-studio-jwt-secret';
    process.env.STUDIO_JWT_REFRESH_SECRET = 'e2e-studio-refresh-secret';
    process.env.STUDIO_PASSWORD_PEPPER = 'e2e-studio-password-pepper';
    process.env.API_KEY_PEPPER = 'e2e-api-key-pepper';
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
  });

  afterEach(async () => {
    await app?.close();
  });

  async function loginAdmin(): Promise<string> {
    const server = app.getHttpServer();
    const email = `onboard-${Date.now()}@test.local`;

    await request(server)
      .post('/v1/web/auth/signup')
      .send({
        accountName: 'Onboard Co',
        email,
        password: 'password123',
      })
      .expect(201);

    const login = await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    return login.body.data.accessToken as string;
  }

  it('GET/PATCH onboarding state for workspace admin', async () => {
    const server = app.getHttpServer();
    const token = await loginAdmin();

    const initial = await request(server)
      .get('/v1/web/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(initial.body.data.required).toBe(true);
    expect(initial.body.data.completed).toBe(false);
    expect(initial.body.data.currentStep).toBe('welcome');

    await request(server)
      .patch('/v1/web/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ completeStep: 'welcome' })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.completedSteps).toContain('welcome');
        expect(res.body.data.currentStep).toBe('workspace');
      });

    await request(server)
      .patch('/v1/web/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ completeStep: 'workspace' })
      .expect(200);

    await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'First app' })
      .expect(201);

    const afterCreate = await request(server)
      .get('/v1/web/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(afterCreate.body.data.currentStep).toBe('project');
    expect(afterCreate.body.data.completedSteps).not.toContain('project');

    await request(server)
      .patch('/v1/web/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ completeStep: 'project' })
      .expect(200);

    const afterProject = await request(server)
      .get('/v1/web/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(afterProject.body.data.completedSteps).toContain('project');

    await request(server)
      .patch('/v1/web/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ complete: true })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.completed).toBe(true);
        expect(res.body.data.currentStep).toBe('done');
      });
  });

  it('editors receive completed onboarding state', async () => {
    const server = app.getHttpServer();
    const adminToken = await loginAdmin();

    const project = await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Shared' })
      .expect(201);

    const projectId = project.body.data.id as string;

    await request(server)
      .post('/v1/web/auth/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'editor1',
        password: 'password123',
        projectIds: [projectId],
      })
      .expect(201);

    const workspaceId = (
      await request(server)
        .get('/v1/web/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    ).body.data.account.id as string;

    const editorLogin = await request(server)
      .post('/v1/web/auth/login')
      .send({
        workspaceId,
        username: 'editor1',
        password: 'password123',
      })
      .expect(201);

    const editorToken = editorLogin.body.data.accessToken as string;

    await request(server)
      .get('/v1/web/onboarding')
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.required).toBe(false);
        expect(res.body.data.completed).toBe(true);
        expect(res.body.data.currentStep).toBe('done');
      });
  });
});
