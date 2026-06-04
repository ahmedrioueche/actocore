import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv, clearQuotaEnforceEnv } from './helpers/e2e-env';

describe('Quota (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;
  let apiKey: string;

  beforeAll(async () => {
    applyDefaultE2eEnv();
    process.env.QUOTA_ENFORCE = 'true';
    process.env.QUOTA_CHAT_PER_MINUTE = '2';
    process.env.QUOTA_CHAT_PER_DAY = '100';
    process.env.QUOTA_CHAT_PER_MONTH = '1000';
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    delete process.env.REDIS_URL;
  });

  afterAll(async () => {
    clearQuotaEnforceEnv();
    await mongod.stop();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();

    const seeded = await seedProjectAndApiKey(app.getHttpServer());
    apiKey = seeded.apiKey;
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 429 when per-minute chat quota is exceeded', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'One' })
      .expect(201);

    await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Two' })
      .expect(201);

    const limited = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Three' })
      .expect(429);

    expect(limited.body.success).toBe(false);
    expect(limited.body.errorCode).toBe('TOO_MANY_REQUESTS');
  });
});
