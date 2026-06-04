import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorCode, StudioPermission } from '@ahmedrioueche/actocore-shared';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';

describe('Studio team seats (e2e)', () => {
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
  });

  afterEach(async () => {
    await app?.close();
  });

  async function seedAdminWithProject(): Promise<{
    adminToken: string;
    adminUserId: string;
    workspaceId: string;
    projectId: string;
  }> {
    const server = app.getHttpServer();
    const email = `admin-${Date.now()}@test.local`;

    await request(server)
      .post('/v1/web/auth/signup')
      .send({
        accountName: 'Seat Workspace',
        email,
        password: 'password123',
      })
      .expect(201);

    const login = await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    const adminToken = login.body.data.accessToken as string;
    const workspaceId = login.body.data.account.id as string;

    const project = await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'App' })
      .expect(201);

    return {
      adminToken,
      adminUserId: login.body.data.user.id as string,
      workspaceId,
      projectId: project.body.data.id as string,
    };
  }

  it('creates seat, logs in with workspaceId + username, PATCH and DELETE', async () => {
    const server = app.getHttpServer();
    const { adminToken, workspaceId, projectId } = await seedAdminWithProject();

    const created = await request(server)
      .post('/v1/web/auth/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'sarah',
        password: 'password123',
        projectIds: [projectId],
      })
      .expect(201);

    const editorUserId = created.body.data.userId as string;
    expect(created.body.data.username).toBe('sarah');
    expect(created.body.data.email).toBeUndefined();

    await request(server)
      .post('/v1/web/auth/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'sarah',
        password: 'password123',
        projectIds: [projectId],
      })
      .expect(409);

    const editorLogin = await request(server)
      .post('/v1/web/auth/login')
      .send({
        workspaceId,
        username: 'sarah',
        password: 'password123',
      })
      .expect(201);

    expect(editorLogin.body.data.user.username).toBe('sarah');
    expect(editorLogin.body.data.account.id).toBe(workspaceId);

    const editorToken = editorLogin.body.data.accessToken as string;
    expect(editorLogin.body.data.permissions).not.toContain(
      StudioPermission.API_KEYS_WRITE,
    );

    await request(server)
      .post('/v1/web/auth/delete-account/request-otp')
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(400)
      .expect((res) => {
        expect(res.body.errorCode).toBe(ErrorCode.SEAT_SELF_DELETE_BLOCKED);
      });

    const project2 = await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'App 2' })
      .expect(201);

    await request(server)
      .patch(`/v1/web/auth/members/${editorUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'sarah_ops',
        projectIds: [projectId, project2.body.data.id],
        password: 'newpassword99',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.username).toBe('sarah_ops');
      });

    await request(server)
      .post('/v1/web/auth/login')
      .send({
        workspaceId,
        username: 'sarah_ops',
        password: 'newpassword99',
      })
      .expect(201);

    await request(server)
      .delete(`/v1/web/auth/members/${editorUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(server)
      .post('/v1/web/auth/login')
      .send({
        workspaceId,
        username: 'sarah_ops',
        password: 'newpassword99',
      })
      .expect(401);
  });

  it('rejects admin self-removal and admin PATCH on owner', async () => {
    const server = app.getHttpServer();
    const { adminToken, adminUserId } = await seedAdminWithProject();

    await request(server)
      .delete(`/v1/web/auth/members/${adminUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400)
      .expect((res) => {
        expect(res.body.errorCode).toBe(ErrorCode.CANNOT_REMOVE_SELF);
      });

    await request(server)
      .patch(`/v1/web/auth/members/${adminUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ displayName: 'Owner' })
      .expect(403);
  });

  it('rejects email-only login for seat users', async () => {
    const server = app.getHttpServer();
    const { adminToken, workspaceId, projectId } = await seedAdminWithProject();

    await request(server)
      .post('/v1/web/auth/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'bob',
        password: 'password123',
        projectIds: [projectId],
      })
      .expect(201);

    await request(server)
      .post('/v1/web/auth/login')
      .send({
        email: 'bob@test.local',
        password: 'password123',
      })
      .expect(401);

    await request(server)
      .post('/v1/web/auth/login')
      .send({
        workspaceId,
        username: 'bob',
        password: 'wrong',
      })
      .expect(401);
  });
});
