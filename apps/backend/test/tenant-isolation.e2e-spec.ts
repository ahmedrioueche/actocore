import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

describe('Tenant isolation (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

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
  });

  afterEach(async () => {
    await app.close();
  });

  it('does not allow access to another project session', async () => {
    const server = app.getHttpServer();
    const projectA = await seedProjectAndApiKey(server, 'Project A');
    const projectB = await seedProjectAndApiKey(server, 'Project B');

    const sessionRes = await request(server)
      .post('/v1/sdk/sessions')
      .set('Authorization', `Bearer ${projectA.apiKey}`)
      .send({})
      .expect(201);

    const sessionId = sessionRes.body.data.id;

    await request(server)
      .get(`/v1/sdk/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${projectB.apiKey}`)
      .expect(404);
  });
});
