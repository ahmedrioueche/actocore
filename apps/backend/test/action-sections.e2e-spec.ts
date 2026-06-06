import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

const INPUT_SCHEMA = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

describe('Action sections (e2e)', () => {
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
    await mongod?.stop();
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
    await app?.close();
  });

  const createSection = (server: App, body: Record<string, unknown>) =>
    request(server)
      .post(`/v1/web/projects/${projectId}/action-sections`)
      .send(body);

  const createAction = (server: App, body: Record<string, unknown>) =>
    request(server)
      .post(`/v1/web/projects/${projectId}/actions`)
      .send({ inputSchema: INPUT_SCHEMA, ...body });

  it('CRUD sections with action counts', async () => {
    const server = app.getHttpServer();

    const created = await createSection(server, {
      name: 'Billing',
      color: '#10b981',
    }).expect(201);
    const sectionId = created.body.data.id;
    expect(created.body.data.enabled).toBe(true);
    expect(created.body.data.actionCount).toBe(0);

    await createAction(server, { name: 'create_invoice', sectionId }).expect(
      201,
    );

    await request(server)
      .get(`/v1/web/projects/${projectId}/action-sections`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].actionCount).toBe(1);
      });

    await request(server)
      .patch(`/v1/web/projects/${projectId}/action-sections/${sectionId}`)
      .send({ name: 'Payments' })
      .expect(200)
      .expect((res) => expect(res.body.data.name).toBe('Payments'));

    await request(server)
      .delete(`/v1/web/projects/${projectId}/action-sections/${sectionId}`)
      .expect(200);
  });

  it('filters actions by section and uncategorized', async () => {
    const server = app.getHttpServer();
    const section = await createSection(server, { name: 'Ops' }).expect(201);
    const sectionId = section.body.data.id;

    await createAction(server, { name: 'deploy', sectionId }).expect(201);
    await createAction(server, { name: 'rollback' }).expect(201);

    await request(server)
      .get(`/v1/web/projects/${projectId}/actions?sectionId=${sectionId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.items).toHaveLength(1);
        expect(res.body.data.items[0].name).toBe('deploy');
      });

    await request(server)
      .get(`/v1/web/projects/${projectId}/actions?sectionId=uncategorized`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.items).toHaveLength(1);
        expect(res.body.data.items[0].name).toBe('rollback');
      });
  });

  it('moves actions to uncategorized when their section is deleted', async () => {
    const server = app.getHttpServer();
    const section = await createSection(server, { name: 'Temp' }).expect(201);
    const sectionId = section.body.data.id;

    const action = await createAction(server, {
      name: 'deploy',
      sectionId,
    }).expect(201);

    await request(server)
      .delete(`/v1/web/projects/${projectId}/action-sections/${sectionId}`)
      .expect(200);

    await request(server)
      .get(`/v1/web/projects/${projectId}/actions/${action.body.data.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.sectionId).toBeUndefined();
      });
  });

  it('hides actions in a disabled section from the assistant', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    const section = await createSection(server, { name: 'Ops' }).expect(201);
    const sectionId = section.body.data.id;
    await createAction(server, { name: 'deploy', sectionId }).expect(201);

    // Enabled section -> action is matched.
    const enabledChat = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Run deploy to production' })
      .expect(201);
    expect(enabledChat.body.data.action).toMatchObject({
      actionName: 'deploy',
      status: 'pending',
    });

    // Disable the section -> action is hidden.
    await request(server)
      .patch(`/v1/web/projects/${projectId}/action-sections/${sectionId}`)
      .send({ enabled: false })
      .expect(200);

    const disabledChat = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Run deploy to production' })
      .expect(201);
    expect(disabledChat.body.data.action).toBeUndefined();
  });

  it('allows actions via the sdk section allowlist', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    const section = await createSection(server, { name: 'Ops' }).expect(201);
    const sectionId = section.body.data.id;
    await createAction(server, { name: 'deploy', sectionId }).expect(201);
    await createAction(server, { name: 'list_users' }).expect(201);

    await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({ security: { allowedSectionIds: [sectionId] } })
      .expect(200);

    const allowed = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Run deploy to production' })
      .expect(201);
    expect(allowed.body.data.action).toMatchObject({
      actionName: 'deploy',
      status: 'pending',
    });

    const blocked = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Show me all users' })
      .expect(201);
    expect(blocked.body.data.action).toBeUndefined();
  });
});
