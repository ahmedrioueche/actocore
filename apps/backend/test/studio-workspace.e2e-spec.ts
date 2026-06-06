import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';

describe('Studio workspace settings (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.STUDIO_AUTH_DISABLED = 'false';
    process.env.STUDIO_AUTO_VERIFY_EMAIL = 'true';
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

  async function loginAdmin(): Promise<{
    token: string;
    workspaceId: string;
    editorToken?: string;
  }> {
    const server = app.getHttpServer();
    const email = `ws-admin-${Date.now()}@test.local`;

    await request(server)
      .post('/v1/web/auth/signup')
      .send({
        accountName: 'Original Name',
        email,
        password: 'password123',
      })
      .expect(201);

    const login = await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    return {
      token: login.body.data.accessToken as string,
      workspaceId: login.body.data.account.id as string,
    };
  }

  it('GET/PATCH account, preferences, profile, api-keys list, project delete', async () => {
    const server = app.getHttpServer();
    const { token, workspaceId } = await loginAdmin();

    const project = await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To delete' })
      .expect(201);

    const projectId = project.body.data.id as string;

    await request(server)
      .post('/v1/web/auth/members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'ops',
        password: 'password123',
        projectIds: [projectId],
      })
      .expect(201);

    const key = await request(server)
      .post('/v1/web/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, name: 'prod' })
      .expect(201);

    const list = await request(server)
      .get(`/v1/web/projects/${projectId}/api-keys`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.data.items).toHaveLength(1);
    expect(list.body.data.total).toBe(1);
    expect(list.body.data.items[0].prefix).toBe(key.body.data.prefix);
    expect(list.body.data.items[0].key).toBeUndefined();

    await request(server)
      .patch('/v1/web/account')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Acme Corp',
        billingEmail: 'billing@acme.test',
        timezone: 'Europe/Paris',
        defaultLocale: 'en',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.name).toBe('Acme Corp');
        expect(res.body.data.billingEmail).toBe('billing@acme.test');
      });

    await request(server)
      .patch('/v1/web/account/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ quotaAlertEmails: false, productEmails: true })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.quotaAlertEmails).toBe(false);
        expect(res.body.data.productEmails).toBe(true);
      });

    await request(server)
      .patch('/v1/web/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Owner', picture: 'https://cdn.test/avatar.png' })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user.displayName).toBe('Owner');
        expect(res.body.data.account.name).toBe('Acme Corp');
      });

    await request(server)
      .patch(`/v1/web/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed app' })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.name).toBe('Renamed app');
      });

    const rotate = await request(server)
      .post(`/v1/web/projects/${projectId}/api-keys/rotate-all`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(rotate.body.data.revokedCount).toBe(1);

    const afterRotate = await request(server)
      .get(`/v1/web/projects/${projectId}/api-keys`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(afterRotate.body.data.items).toHaveLength(0);

    await request(server)
      .delete(`/v1/web/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(server)
      .get(`/v1/web/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    const editorLogin = await request(server)
      .post('/v1/web/auth/login')
      .send({
        workspaceId,
        username: 'ops',
        password: 'password123',
      })
      .expect(201);

    await request(server)
      .get(`/v1/web/projects/${projectId}`)
      .set('Authorization', `Bearer ${editorLogin.body.data.accessToken}`)
      .expect(403);
  });

  it('signup creates default project and exposes quota + sessions browser', async () => {
    const server = app.getHttpServer();
    const email = `default-proj-${Date.now()}@test.local`;

    const signup = await request(server)
      .post('/v1/web/auth/signup')
      .send({
        accountName: 'Starter',
        email,
        password: 'password123',
      })
      .expect(201);

    expect(signup.body.data.defaultProjectId).toBeDefined();

    const login = await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    const token = login.body.data.accessToken as string;
    const projectId = signup.body.data.defaultProjectId as string;

    const projects = await request(server)
      .get('/v1/web/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(projects.body.data.items).toHaveLength(1);
    expect(projects.body.data.items[0].name).toBe('My project');

    await request(server)
      .get(`/v1/web/projects/${projectId}/usage/quota`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.projectId).toBe(projectId);
      });

    const key = await request(server)
      .post('/v1/web/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, name: 'dev' })
      .expect(201);

    await request(server)
      .post('/v1/sdk/sessions')
      .set('Authorization', `Bearer ${key.body.data.key}`)
      .send({ externalUserId: 'user-42' })
      .expect(201);

    const sessions = await request(server)
      .get(`/v1/web/projects/${projectId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(sessions.body.data.items).toHaveLength(1);
    expect(sessions.body.data.items[0].externalUserId).toBe('user-42');
  });

  it('team audit log records seat lifecycle', async () => {
    const server = app.getHttpServer();
    const { token } = await loginAdmin();

    const project = await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Audit app' })
      .expect(201);

    const created = await request(server)
      .post('/v1/web/auth/members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'audited',
        password: 'password123',
        projectIds: [project.body.data.id],
      })
      .expect(201);

    const userId = created.body.data.userId as string;

    const audit = await request(server)
      .get('/v1/web/auth/members/audit')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(audit.body.data.items[0].action).toBe('seat.created');
    expect(audit.body.data.items[0].targetUserId).toBe(userId);

    await request(server)
      .delete(`/v1/web/auth/members/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const afterRemove = await request(server)
      .get('/v1/web/auth/members/audit?limit=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(afterRemove.body.data.items[0].action).toBe('seat.removed');
  });

  it('archives project and filters list by archived and search', async () => {
    const server = app.getHttpServer();
    const { token } = await loginAdmin();

    const alpha = await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alpha App' })
      .expect(201);

    const beta = await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Beta App' })
      .expect(201);

    const alphaId = alpha.body.data.id as string;

    await request(server)
      .patch(`/v1/web/projects/${alphaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archived: true })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.archived).toBe(true);
        expect(res.body.data.archivedAt).toBeDefined();
      });

    const active = await request(server)
      .get('/v1/web/projects?archived=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const activeIds = active.body.data.items.map((p: { id: string }) => p.id);
    expect(activeIds).toContain(beta.body.data.id);
    expect(activeIds).not.toContain(alphaId);

    const archivedOnly = await request(server)
      .get('/v1/web/projects?archived=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(archivedOnly.body.data.items).toHaveLength(1);
    expect(archivedOnly.body.data.items[0].name).toBe('Alpha App');

    const search = await request(server)
      .get('/v1/web/projects?archived=false&search=beta')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(search.body.data.items).toHaveLength(1);
    expect(search.body.data.items[0].name).toBe('Beta App');
  });

  it('editor cannot PATCH account or delete project', async () => {
    const server = app.getHttpServer();
    const { token, workspaceId } = await loginAdmin();

    const project = await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Protected' })
      .expect(201);

    const projectId = project.body.data.id as string;

    await request(server)
      .post('/v1/web/auth/members')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'editor1',
        password: 'password123',
        projectIds: [projectId],
      })
      .expect(201);

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
      .patch('/v1/web/account')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ name: 'Hijack' })
      .expect(403)
      .expect((res) => {
        expect(res.body.errorCode).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS);
      });

    await request(server)
      .delete(`/v1/web/projects/${projectId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(403);
  });
});
