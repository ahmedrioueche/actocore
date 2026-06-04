import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { StudioUser } from '../src/studio/schemas/studio-user.schema';

describe('Studio auth flows (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.STUDIO_AUTH_DISABLED = 'false';
    process.env.STUDIO_AUTO_VERIFY_EMAIL = 'false';
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

  async function readUserToken(email: string, field: 'verificationToken' | 'resetPasswordToken') {
    const userModel = app.get(getModelToken(StudioUser.name));
    const user = await userModel.findOne({ email: email.toLowerCase() }).exec();
    return user?.[field] as string | undefined;
  }

  it('verify-email then login', async () => {
    const server = app.getHttpServer();
    const email = `verify-${Date.now()}@test.local`;

    await request(server)
      .post('/v1/web/auth/signup')
      .send({
        accountName: 'Verify Co',
        email,
        password: 'password123',
      })
      .expect(201);

    await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(401)
      .expect((res) => {
        expect(res.body.errorCode).toBe(ErrorCode.EMAIL_NOT_VERIFIED);
      });

    const token = await readUserToken(email, 'verificationToken');
    expect(token).toBeDefined();

    const verified = await request(server)
      .post('/v1/web/auth/verify-email')
      .send({ token })
      .expect(201);

    expect(verified.body.data.accessToken).toBeDefined();
    expect(verified.body.data.user.emailVerified).toBe(true);

    await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);
  });

  it('forgot-password and reset-password', async () => {
    const server = app.getHttpServer();
    const email = `reset-${Date.now()}@test.local`;

    await request(server)
      .post('/v1/web/auth/signup')
      .send({
        accountName: 'Reset Co',
        email,
        password: 'password123',
      })
      .expect(201);

    const userModel = app.get(getModelToken(StudioUser.name));
    await userModel.updateOne(
      { email: email.toLowerCase() },
      { emailVerified: true, verificationToken: undefined },
    );

    await request(server)
      .post('/v1/web/auth/forgot-password')
      .send({ email })
      .expect(201);

    const resetToken = await readUserToken(email, 'resetPasswordToken');
    expect(resetToken).toBeDefined();

    await request(server)
      .post('/v1/web/auth/reset-password')
      .send({ token: resetToken, password: 'newpassword99' })
      .expect(201);

    await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(401);

    await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'newpassword99' })
      .expect(201);
  });

  it('logout invalidates access and refresh tokens', async () => {
    const server = app.getHttpServer();
    const email = `logout-${Date.now()}@test.local`;

    await request(server)
      .post('/v1/web/auth/signup')
      .send({
        accountName: 'Logout Co',
        email,
        password: 'password123',
      })
      .expect(201);

    const userModel = app.get(getModelToken(StudioUser.name));
    await userModel.updateOne(
      { email: email.toLowerCase() },
      { emailVerified: true },
    );

    const login = await request(server)
      .post('/v1/web/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    const accessToken = login.body.data.accessToken as string;
    const refreshToken = login.body.data.refreshToken as string;

    await request(server)
      .post('/v1/web/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    await request(server)
      .get('/v1/web/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    await request(server)
      .post('/v1/web/auth/refresh')
      .send({ refreshToken })
      .expect(401)
      .expect((res) => {
        expect(res.body.errorCode).toBe(ErrorCode.INVALID_REFRESH_TOKEN);
      });
  });
});
