import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

describe('SDK voice (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;
  let apiKey: string;

  beforeAll(async () => {
    applyDefaultE2eEnv();
    process.env.VOICE_STT_PROVIDER = 'stub';
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
  });

  afterEach(async () => {
    await app.close();
  });

  it('transcribes uploaded audio with stub STT', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    const res = await request(server)
      .post('/v1/sdk/voice/transcribe')
      .set(auth)
      .attach('audio', Buffer.from('fake-audio'), {
        filename: 'test.webm',
        contentType: 'audio/webm',
      })
      .expect(201);

    expect(res.body.data.text).toContain('ActoCore');
    expect(res.body.data.provider).toBe('stub');
  });

  it('exposes voice in runtime config', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    const res = await request(server)
      .get('/v1/sdk/runtime')
      .set(auth)
      .expect(200);

    expect(res.body.data.features).toContain('voice');
    expect(res.body.data.voice?.sttProvider).toBe('stub');
  });
});
