import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

describe('Public playground (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;
  let marketingProjectId: string;
  let marketingApiKey: string;

  const allowedOrigin = 'http://localhost:3001';
  const visitorId = 'playground-visitor-e2e';

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
    marketingProjectId = seeded.projectId;
    marketingApiKey = seeded.apiKey;
    await seedApp.close();

    process.env.MARKETING_CHAT_ENABLED = 'true';
    process.env.MARKETING_CHAT_PROJECT_ID = marketingProjectId;
    process.env.MARKETING_CHAT_ALLOWED_ORIGINS = allowedOrigin;
    process.env.PLAYGROUND_ENABLED = 'true';
    process.env.PLAYGROUND_SESSION_SECRET = 'e2e-playground-secret';

    app = await createApp();
  }, 120000);

  afterAll(async () => {
    await app?.close();
    delete process.env.PLAYGROUND_ENABLED;
    delete process.env.PLAYGROUND_SESSION_SECRET;
    await mongod?.stop();
  });

  it('bootstraps an isolated playground project', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/marketing/playground/bootstrap')
      .set('Origin', allowedOrigin)
      .send({ visitorId, projectName: 'E2E Demo App' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.projectId).toBeTruthy();
    expect(res.body.data.projectId).not.toBe(marketingProjectId);
    expect(res.body.data.apiKey).toMatch(/^ak_/);
    expect(res.body.data.playgroundToken).toMatch(/^pg_/);
  });

  it('uses the playground project for SDK chat without marketing knowledge bleed', async () => {
    const bootstrap = (
      await request(app.getHttpServer())
        .post('/v1/marketing/playground/bootstrap')
        .set('Origin', allowedOrigin)
        .send({ visitorId: `${visitorId}-chat`, projectName: 'Chat Demo' })
        .expect(201)
    ).body.data;

    const pages = await request(app.getHttpServer())
      .get(`/v1/marketing/playground/projects/${bootstrap.projectId}/app-pages`)
      .set('Origin', allowedOrigin)
      .set('X-Playground-Token', bootstrap.playgroundToken)
      .expect(200);

    expect(pages.body.data.some((page: { slug: string }) => page.slug === 'users')).toBe(
      true,
    );

    const sessionId = (
      await request(app.getHttpServer())
        .post('/v1/sdk/sessions')
        .set('Authorization', `Bearer ${bootstrap.apiKey}`)
        .send({ externalUserId: `${visitorId}-chat:playground` })
        .expect(201)
    ).body.data.id;

    const res = await request(app.getHttpServer())
      .post('/v1/sdk/chat/stream')
      .set('Authorization', `Bearer ${bootstrap.apiKey}`)
      .set('Accept', 'text/event-stream')
      .send({
        sessionId,
        message: 'what pages does this app have?',
        hostContext: { currentPage: 'users', route: '/users' },
      })
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

    expect(res.text).toContain('Users');
    expect(res.text).not.toContain('ActoCore overview');
    expect(res.text).not.toContain('studio-overview');
  });

  it('keeps marketing hero project separate', async () => {
    const runtime = await request(app.getHttpServer())
      .get('/v1/marketing/sdk/runtime')
      .set('Origin', allowedOrigin)
      .expect(200);

    expect(runtime.body.data.projectId).toBe(marketingProjectId);

    await request(app.getHttpServer())
      .get('/v1/sdk/runtime')
      .set('Authorization', `Bearer ${marketingApiKey}`)
      .expect(200);
  });
});
