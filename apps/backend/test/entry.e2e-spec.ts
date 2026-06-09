import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

describe('Entry layer (e2e)', () => {
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
    apiKey = seeded.apiKey;
    projectId = seeded.projectId;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /v1/sdk/runtime', () => {
    return request(app.getHttpServer())
      .get('/v1/sdk/runtime')
      .set('Authorization', `Bearer ${apiKey}`)
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-actocore-entry']).toBe('sdk');
        expect(res.body.success).toBe(true);
        expect(res.body.data.apiVersion).toBe('v1');
        expect(res.body.data.projectId).toBe(projectId);
      });
  });

  it('POST /v1/sdk/sessions then POST /v1/sdk/chat', async () => {
    const server = app.getHttpServer();

    const auth = { Authorization: `Bearer ${apiKey}` };

    const sessionRes = await request(server)
      .post('/v1/sdk/sessions')
      .set(auth)
      .send({ externalUserId: 'user-1' })
      .expect(201);

    const sessionId = sessionRes.body.data.id;

    const chatRes = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ sessionId, message: 'Hello' })
      .expect(201);

    expect(chatRes.body.success).toBe(true);
    expect(chatRes.body.data.sessionId).toBe(sessionId);
    expect(chatRes.body.data.content).toContain('[stub]');
    expect(chatRes.body.data.intent).toBe('direct');
    expect(chatRes.body.data.usage?.model).toBe('stub');
  });

  it('continues a session and lists messages', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    const sessionId = (
      await request(server)
        .post('/v1/sdk/sessions')
        .set(auth)
        .send({})
        .expect(201)
    ).body.data.id;

    await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ sessionId, message: 'First turn' })
      .expect(201);

    const second = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ sessionId, message: 'Second turn' })
      .expect(201);

    expect(second.body.data.intent).toBe('direct');

    const messages = await request(server)
      .get(`/v1/sdk/sessions/${sessionId}/messages`)
      .set(auth)
      .expect(200);

    expect(messages.body.data).toHaveLength(4);
    expect(messages.body.data[0].content).toBe('First turn');
    expect(messages.body.data[2].content).toBe('Second turn');
  });

  it('POST /v1/sdk/chat/stream returns SSE events', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    const sessionId = (
      await request(server)
        .post('/v1/sdk/sessions')
        .set(auth)
        .send({})
        .expect(201)
    ).body.data.id;

    const res = await request(server)
      .post('/v1/sdk/chat/stream')
      .set(auth)
      .set('Accept', 'text/event-stream')
      .send({ sessionId, message: 'Stream hello' })
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

    expect(res.text).toContain('"type":"meta"');
    expect(res.text).toContain('"type":"delta"');
    expect(res.text).toContain('"type":"done"');
    expect(res.text).toContain('[stub]');
  });

  it('uses direct LLM when action phrasing is sent but no actions exist', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    const res = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Run the deploy script' })
      .expect(201);

    expect(res.body.data.intent).toBe('direct');
    expect(res.body.data.content).toContain('[stub]');
  });
});
