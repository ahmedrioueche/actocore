import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';

describe('Usage (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;
  let projectId: string;
  let apiKey: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
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

  it('records usage after SDK chat and exposes summary', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Hello' })
      .expect(201);

    const summary = await request(server)
      .get(`/v1/web/projects/${projectId}/usage`)
      .expect(200);

    expect(summary.body.data.totalRequests).toBeGreaterThanOrEqual(1);
    expect(summary.body.data.byIntent.direct).toBeGreaterThanOrEqual(1);
  });
});
