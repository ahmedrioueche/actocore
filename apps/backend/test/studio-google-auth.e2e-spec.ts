import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';

describe('Studio Google OAuth (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.STUDIO_AUTH_DISABLED = 'false';
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
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;

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

  it('returns GOOGLE_NOT_CONFIGURED when Google OAuth env is missing', async () => {
    await request(app.getHttpServer())
      .get('/v1/web/auth/google')
      .expect(400)
      .expect((res) => {
        expect(res.body.errorCode).toBe(ErrorCode.GOOGLE_NOT_CONFIGURED);
      });
  });

  it('returns Google auth URL when configured', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:5174/auth/callback';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const configured = moduleFixture.createNestApplication({ bodyParser: false });
    configureApp(configured);
    await configured.init();

    const res = await request(configured.getHttpServer())
      .get('/v1/web/auth/google')
      .set('Origin', 'http://localhost:5174')
      .expect(200);

    expect(res.body.data.authUrl).toContain('accounts.google.com');
    expect(res.body.data.authUrl).toContain('test-google-client-id');

    await configured.close();
  });
});
