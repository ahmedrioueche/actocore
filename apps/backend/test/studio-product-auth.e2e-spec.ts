import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorCode, StudioPermission } from '@ahmedrioueche/actocore-shared';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { StudioUser } from '../src/studio/schemas/studio-user.schema';
import { hashOtp } from '../src/studio/utils/studio-otp.util';

describe('Studio product auth (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;
  let adminToken: string;
  let projectId: string;
  let workspaceId: string;

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

  it('signup → login → project → editor cannot issue API keys', async () => {
    const server = app.getHttpServer();
    const email = `admin-${Date.now()}@test.local`;

    await request(server)
      .post('/v1/web/auth/signup')
      .send({
        accountName: 'Acme',
        email,
        password: 'password123',
      })
      .expect(201);

    const login = await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    adminToken = login.body.data.accessToken as string;
    workspaceId = login.body.data.account.id as string;
    expect(login.body.data.refreshToken).toBeDefined();

    const project = await request(server)
      .post('/v1/web/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Main app' })
      .expect(201);

    projectId = project.body.data.id as string;

    await request(server)
      .post('/v1/web/auth/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'editor1',
        password: 'password123',
        projectIds: [projectId],
      })
      .expect(201);

    await request(server)
      .post('/v1/web/auth/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'editor2',
        password: 'password123',
        projectIds: [projectId],
      })
      .expect(201);

    const editorLogin = await request(server)
      .post('/v1/web/auth/login')
      .send({
        workspaceId,
        username: 'editor2',
        password: 'password123',
      })
      .expect(201);

    const editorToken = editorLogin.body.data.accessToken as string;
    expect(editorLogin.body.data.permissions).not.toContain(
      StudioPermission.API_KEYS_WRITE,
    );

    await request(server)
      .post('/v1/web/api-keys')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ projectId, name: 'blocked' })
      .expect(403)
      .expect((res) => {
        expect(res.body.errorCode).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS);
      });

    await request(server)
      .post(`/v1/web/projects/${projectId}/knowledge`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        type: 'text',
        title: 'FAQ',
        content: 'ActoCore connects apps to AI.',
      })
      .expect(201);
  });

  it('refresh returns a new access token', async () => {
    const server = app.getHttpServer();
    const email = `refresh-${Date.now()}@test.local`;

    await request(server)
      .post('/v1/web/auth/signup')
      .send({
        accountName: 'Refresh Co',
        email,
        password: 'password123',
      })
      .expect(201);

    const login = await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    const refreshToken = login.body.data.refreshToken as string;

    const refreshed = await request(server)
      .post('/v1/web/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(refreshed.body.data.accessToken).toBeDefined();

    await request(server)
      .get('/v1/web/auth/me')
      .set('Authorization', `Bearer ${refreshed.body.data.accessToken}`)
      .expect(200);
  });

  it('rejects web routes without session when auth enabled', async () => {
    await request(app.getHttpServer())
      .get('/v1/web/projects')
      .expect(401);
  });

  describe('delete-account OTP', () => {
    async function seedDeleteOtp(email: string): Promise<string> {
      const otp = '847291';
      const hash = await hashOtp(
        otp,
        process.env.STUDIO_PASSWORD_PEPPER as string,
      );
      const userModel = app.get(getModelToken(StudioUser.name));
      await userModel.updateOne(
        { email: email.toLowerCase() },
        {
          deleteAccountOtpHash: hash,
          deleteAccountOtpExpiry: new Date(Date.now() + 15 * 60 * 1000),
        },
      );
      return otp;
    }

    it('blocks workspace delete for admin with team members', async () => {
      const server = app.getHttpServer();
      const email = `del-admin-${Date.now()}@test.local`;

      await request(server)
        .post('/v1/web/auth/signup')
        .send({
          accountName: 'Delete Test',
          email,
          password: 'password123',
        })
        .expect(201);

      const login = await request(server)
        .post('/v1/web/auth/login')
        .send({ email, password: 'password123' })
        .expect(201);

      const token = login.body.data.accessToken as string;
      const wsId = login.body.data.account.id as string;

      const project = await request(server)
        .post('/v1/web/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'App' })
        .expect(201);

      const created = await request(server)
        .post('/v1/web/auth/members')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'teameditor',
          password: 'password123',
          projectIds: [project.body.data.id],
        })
        .expect(201);

      const editorUserId = created.body.data.userId as string;

      await request(server)
        .post('/v1/web/auth/delete-account/request-otp')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.errorCode).toBe(ErrorCode.DELETE_ACCOUNT_BLOCKED);
        });

      await request(server)
        .delete(`/v1/web/auth/members/${editorUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(server)
        .post('/v1/web/auth/login')
        .send({
          workspaceId: wsId,
          username: 'teameditor',
          password: 'password123',
        })
        .expect(401);
    });

    it('rejects confirm without a valid OTP', async () => {
      const server = app.getHttpServer();
      const email = `del-solo-${Date.now()}@test.local`;

      await request(server)
        .post('/v1/web/auth/signup')
        .send({
          accountName: 'Solo',
          email,
          password: 'password123',
        })
        .expect(201);

      const login = await request(server)
        .post('/v1/web/auth/login')
        .send({ email, password: 'password123' })
        .expect(201);

      const token = login.body.data.accessToken as string;

      await request(server)
        .post('/v1/web/auth/delete-account/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ otp: '000000' })
        .expect(400)
        .expect((res) => {
          expect(res.body.errorCode).toBe(ErrorCode.INVALID_OTP);
        });
    });
  });
});
