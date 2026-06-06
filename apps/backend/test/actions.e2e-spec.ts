import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

describe('Actions (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;
  let projectId: string;
  let apiKey: string;

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

  it('CRUD actions on web control plane', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post(`/v1/web/projects/${projectId}/actions`)
      .send({
        name: 'deploy',
        description: 'Deploy the app',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      })
      .expect(201);

    const actionId = created.body.data.id;
    expect(created.body.data.name).toBe('deploy');

    await request(server)
      .get(`/v1/web/projects/${projectId}/actions`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.items).toHaveLength(1);
      });

    await request(server)
      .patch(`/v1/web/projects/${projectId}/actions/${actionId}`)
      .send({ enabled: false })
      .expect(200);

    await request(server)
      .delete(`/v1/web/projects/${projectId}/actions/${actionId}`)
      .expect(200);
  });

  it('returns pending action on SDK chat when action is registered', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    await request(server)
      .post(`/v1/web/projects/${projectId}/actions`)
      .send({
        name: 'deploy',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      })
      .expect(201);

    const chat = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Run deploy to production' })
      .expect(201);

    expect(chat.body.data.intent).toBe('action');
    expect(chat.body.data.action).toMatchObject({
      actionName: 'deploy',
      status: 'pending',
      input: {},
    });
  });
});
