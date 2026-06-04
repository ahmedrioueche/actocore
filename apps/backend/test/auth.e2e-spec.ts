import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;
  let apiKey: string;
  let projectId: string;

  beforeAll(async () => {
    applyDefaultE2eEnv();
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    delete process.env.REDIS_URL;
  });

  afterAll(async () => {
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
    projectId = seeded.projectId;
    apiKey = seeded.apiKey;
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects SDK routes without a bearer token', () => {
    return request(app.getHttpServer())
      .get('/v1/sdk/runtime')
      .expect(401)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.errorCode).toBe(ErrorCode.API_KEY_MISSING);
      });
  });

  it('allows SDK routes with a valid bearer token', () => {
    return request(app.getHttpServer())
      .get('/v1/sdk/runtime')
      .set('Authorization', `Bearer ${apiKey}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
  });

  it('rejects issuing keys for unknown projects', () => {
    return request(app.getHttpServer())
      .post('/v1/web/api-keys')
      .send({ projectId: '000000000000000000000000' })
      .expect(404);
  });

  it('rejects revoked keys', async () => {
    const server = app.getHttpServer();
    const issueRes = await request(server)
      .post('/v1/web/api-keys')
      .send({ projectId, name: 'revoke-me' })
      .expect(201);

    const keyId = issueRes.body.data.id;
    const key = issueRes.body.data.key;

    await request(server).delete(`/v1/web/api-keys/${keyId}`).expect(200);

    await request(server)
      .get('/v1/sdk/runtime')
      .set('Authorization', `Bearer ${key}`)
      .expect(401)
      .expect((res) => {
        expect(res.body.errorCode).toBe(ErrorCode.API_KEY_REVOKED);
      });
  });
});
