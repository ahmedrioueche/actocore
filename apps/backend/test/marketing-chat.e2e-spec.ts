import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

describe('Marketing chat (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;
  let projectId: string;

  const allowedOrigin = 'http://localhost:3001';

  async function createApp(): Promise<INestApplication<App>> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp = moduleFixture.createNestApplication({ bodyParser: false });
    configureApp(nestApp);
    await nestApp.init();
    return nestApp;
  }

  beforeAll(async () => {
    applyDefaultE2eEnv();
    mongod = await MongoMemoryServer.create({
      instance: { launchTimeout: 60000 },
    });
    process.env.MONGODB_URI = mongod.getUri();
    delete process.env.REDIS_URL;

    const seedApp = await createApp();
    const seeded = await seedProjectAndApiKey(seedApp.getHttpServer());
    projectId = seeded.projectId;
    await seedApp.close();

    process.env.MARKETING_CHAT_ENABLED = 'true';
    process.env.MARKETING_CHAT_PROJECT_ID = projectId;
    process.env.MARKETING_CHAT_ALLOWED_ORIGINS = allowedOrigin;
    process.env.MARKETING_CHAT_RATE_LIMIT_PER_MINUTE = '30';

    app = await createApp();
  }, 120000);

  afterAll(async () => {
    await app?.close();
    delete process.env.MARKETING_CHAT_ENABLED;
    delete process.env.MARKETING_CHAT_PROJECT_ID;
    delete process.env.MARKETING_CHAT_ALLOWED_ORIGINS;
    delete process.env.MARKETING_CHAT_RATE_LIMIT_PER_MINUTE;
    await mongod?.stop();
  });

  it('GET /v1/marketing/sdk/runtime with allowed origin', () => {
    return request(app.getHttpServer())
      .get('/v1/marketing/sdk/runtime')
      .set('Origin', allowedOrigin)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.projectId).toBe(projectId);
        expect(res.body.data.features).toContain('app-pages');
      });
  });

  it('rejects requests without allowed origin', () => {
    return request(app.getHttpServer())
      .get('/v1/marketing/sdk/runtime')
      .expect(403);
  });

  it('POST /v1/marketing/sdk/chat/stream returns SSE events', async () => {
    const server = app.getHttpServer();

    const sessionId = (
      await request(server)
        .post('/v1/marketing/sdk/sessions')
        .set('Origin', allowedOrigin)
        .send({ externalUserId: 'visitor-1' })
        .expect(201)
    ).body.data.id;

    const res = await request(server)
      .post('/v1/marketing/sdk/chat/stream')
      .set('Origin', allowedOrigin)
      .set('Accept', 'text/event-stream')
      .send({ sessionId, message: 'Hello from marketing' })
      .buffer(true)
      .parse((response, callback) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          body += chunk;
        });
        response.on('end', () => callback(null, body));
      })
      .expect(200);

    expect(res.text).toContain('"type":"done"');
    expect(res.text).toContain('[stub]');
  });
});
