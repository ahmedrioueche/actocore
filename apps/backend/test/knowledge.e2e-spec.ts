import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';
import { readKnowledgePdfFixture } from './helpers/knowledge-fixtures';

describe('Knowledge / Q&A (e2e)', () => {
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

  it('ingests text knowledge and lists sources', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post(`/v1/web/projects/${projectId}/knowledge`)
      .send({
        type: 'text',
        title: 'Product docs',
        content:
          'ActoCore is an AI integration layer. It supports Q&A and action modes for SDK applications.',
      })
      .expect(201);

    expect(created.body.data.status).toBe('ready');
    expect(created.body.data.chunkCount).toBeGreaterThan(0);

    await request(server)
      .get(`/v1/web/projects/${projectId}/knowledge`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.items).toHaveLength(1);
      });
  });

  it('returns Q&A citations on SDK chat', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    await request(server)
      .post(`/v1/web/projects/${projectId}/knowledge`)
      .send({
        type: 'text',
        title: 'FAQ',
        content: 'ActoCore helps developers embed AI chat and actions in their apps.',
      })
      .expect(201);

    const chat = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'What is ActoCore?' })
      .expect(201);

    expect(chat.body.data.intent).toBe('qa');
    expect(chat.body.data.sources?.length).toBeGreaterThan(0);
    expect(chat.body.data.sources[0].sourceTitle).toBe('FAQ');
  });

  it('uploads a text file and indexes it', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post(`/v1/web/projects/${projectId}/knowledge/upload`)
      .query({ title: 'Uploaded notes' })
      .attach('file', Buffer.from('ActoCore SDK supports knowledge upload via multipart API.'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
      .expect(201);

    expect(created.body.data.type).toBe('document');
    expect(created.body.data.status).toBe('ready');
    expect(created.body.data.chunkCount).toBeGreaterThan(0);
    expect(created.body.data.file?.originalFilename).toBe('notes.txt');
    expect(created.body.data.file?.mimeType).toBe('text/plain');
  });

  it('uploads a PDF and returns Q&A citations on SDK chat', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    const created = await request(server)
      .post(`/v1/web/projects/${projectId}/knowledge/upload`)
      .query({ title: 'PDF docs' })
      .attach('file', readKnowledgePdfFixture(), {
        filename: 'actocore-knowledge.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    expect(created.body.data.type).toBe('document');
    expect(created.body.data.status).toBe('ready');
    expect(created.body.data.chunkCount).toBeGreaterThan(0);
    expect(created.body.data.file?.mimeType).toBe('application/pdf');

    const chat = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Tell me about the Dummy PDF file' })
      .expect(201);

    expect(chat.body.data.intent).toBe('qa');
    expect(chat.body.data.sources?.length).toBeGreaterThan(0);
    expect(chat.body.data.sources[0].sourceTitle).toBe('PDF docs');
  });
});
