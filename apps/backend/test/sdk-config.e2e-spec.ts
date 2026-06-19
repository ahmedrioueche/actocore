import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

describe('SDK project config (e2e)', () => {
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

  it('GET/PATCH sdk-config and exposes sdk on runtime', async () => {
    const server = app.getHttpServer();

    const initial = await request(server)
      .get(`/v1/web/projects/${projectId}/sdk-config`)
      .expect(200);

    expect(initial.body.data.sdkConfigVersion).toBe(0);

    const patched = await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({
        i18n: { locale: 'fr' },
        ui: { showIntentBadge: true },
        security: { allowedActionNames: ['list_users'] },
      })
      .expect(200);

    expect(patched.body.data.sdkConfigVersion).toBe(1);
    expect(patched.body.data.i18n.locale).toBe('fr');
    expect(patched.body.data.ui.showIntentBadge).toBe(true);
    expect(patched.body.data.security.allowedActionNames).toEqual(['list_users']);

    const runtime = await request(server)
      .get('/v1/sdk/runtime')
      .set({ Authorization: `Bearer ${apiKey}` })
      .expect(200);

    expect(runtime.body.data.sdk.sdkConfigVersion).toBe(1);
    expect(runtime.body.data.features).toContain('sdk-config');
  });

  it('rejects invalid PATCH payloads', async () => {
    const server = app.getHttpServer();

    await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({ unknownField: true })
      .expect(400);

    const huge = 'x'.repeat(40_000);
    await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({ i18n: { translations: { en: { huge } } } })
      .expect(400);
  });

  it('accepts widget layout PATCH fields', async () => {
    const server = app.getHttpServer();

    const patched = await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({
        ui: {
          presentation: 'inline',
          widget: {
            panelLayout: 'dock-right',
            panelWidth: '32rem',
            panelHeight: 'min(40rem, calc(100vh - 6rem))',
          },
          inline: {
            maxWidth: '28rem',
            height: '100%',
            minHeight: '24rem',
          },
        },
      })
      .expect(200);

    expect(patched.body.data.ui.presentation).toBe('inline');
    expect(patched.body.data.ui.widget.panelLayout).toBe('dock-right');
    expect(patched.body.data.ui.widget.panelWidth).toBe('32rem');
    expect(patched.body.data.ui.inline.maxWidth).toBe('28rem');

    const runtime = await request(server)
      .get('/v1/sdk/runtime')
      .set({ Authorization: `Bearer ${apiKey}` })
      .expect(200);

    expect(runtime.body.data.sdk.ui.widget.panelLayout).toBe('dock-right');
    expect(runtime.body.data.sdk.ui.inline.maxWidth).toBe('28rem');
  });

  it('accepts launcher placement PATCH fields', async () => {
    const server = app.getHttpServer();

    const patched = await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({
        ui: {
          launcher: {
            placement: 'host',
            variant: 'button',
            label: 'Ask AI',
            ariaLabel: 'Open assistant',
          },
        },
      })
      .expect(200);

    expect(patched.body.data.ui.launcher.placement).toBe('host');
    expect(patched.body.data.ui.launcher.variant).toBe('button');
    expect(patched.body.data.ui.launcher.label).toBe('Ask AI');

    const runtime = await request(server)
      .get('/v1/sdk/runtime')
      .set({ Authorization: `Bearer ${apiKey}` })
      .expect(200);

    expect(runtime.body.data.sdk.ui.launcher.placement).toBe('host');
    expect(runtime.body.data.sdk.ui.launcher.variant).toBe('button');
  });

  it('preserves copy and launcher when a later PATCH sends empty ui sub-objects', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({
        ui: {
          showSources: true,
          showIntentBadge: false,
          showActionsHint: false,
          showActionPicker: false,
          composerMinRows: 1,
          composerMaxRows: 6,
          text: {
            headerTitle: 'Support bot',
            placeholder: 'How can we help?',
          },
          launcher: {
            ariaLabel: 'Open support chat',
            variant: 'button',
            label: 'Support',
          },
        },
      })
      .expect(200);

    await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({
        theme: {
          mode: 'dark',
          tokens: { 'color-primary': '#111827' },
        },
        ui: {
          showSources: true,
          showIntentBadge: false,
          showActionsHint: false,
          showActionPicker: false,
          composerMinRows: 1,
          composerMaxRows: 6,
          text: {},
          launcher: {},
          widget: {},
          inline: {},
        },
      })
      .expect(200);

    const runtime = await request(server).get('/v1/sdk/runtime').set(auth).expect(200);

    expect(runtime.body.data.sdk.ui.text.headerTitle).toBe('Support bot');
    expect(runtime.body.data.sdk.ui.text.placeholder).toBe('How can we help?');
    expect(runtime.body.data.sdk.ui.launcher.ariaLabel).toBe('Open support chat');
    expect(runtime.body.data.sdk.ui.launcher.label).toBe('Support');
    expect(runtime.body.data.sdk.theme.tokens['color-primary']).toBe('#111827');
  });

  it('accepts branding PATCH with empty launcher fields omitted', async () => {
    const server = app.getHttpServer();

    const patched = await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({
        theme: {
          mode: 'light',
          tokens: { 'color-primary': '#4f46e5' },
        },
        ui: {
          showSources: true,
          showIntentBadge: false,
          showActionsHint: true,
          showActionPicker: false,
          composerMinRows: 1,
          composerMaxRows: 6,
          text: {},
          launcher: {},
        },
      })
      .expect(200);

    expect(patched.body.data.theme.tokens['color-primary']).toBe('#4f46e5');
  });

  it('filters orchestrator actions by dashboard allowlist', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${apiKey}` };

    const actionBody = {
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    };

    await request(server)
      .post(`/v1/web/projects/${projectId}/actions`)
      .send({ name: 'deploy', description: 'Deploy', ...actionBody })
      .expect(201);

    await request(server)
      .post(`/v1/web/projects/${projectId}/actions`)
      .send({ name: 'list_users', description: 'List users', ...actionBody })
      .expect(201);

    await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({ security: { allowedActionNames: ['list_users'] } })
      .expect(200);

    const blocked = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Run deploy to production' })
      .expect(201);

    expect(blocked.body.data.intent).toBe('action');
    expect(blocked.body.data.action).toBeUndefined();
    expect(blocked.body.data.content).toMatch(/could not match your request/i);
    expect(blocked.body.data.content).toContain('list_users');
    expect(blocked.body.data.content).not.toContain('deploy');

    const allowed = await request(server)
      .post('/v1/sdk/chat')
      .set(auth)
      .send({ message: 'Show me all users' })
      .expect(201);

    expect(allowed.body.data.intent).toBe('action');
    expect(allowed.body.data.action).toMatchObject({
      actionName: 'list_users',
      status: 'pending',
    });
  });

  it('isolates sdk-config per project', async () => {
    const server = app.getHttpServer();
    const other = await seedProjectAndApiKey(server, 'Other project');

    await request(server)
      .patch(`/v1/web/projects/${projectId}/sdk-config`)
      .send({ i18n: { locale: 'fr' } })
      .expect(200);

    const otherConfig = await request(server)
      .get(`/v1/web/projects/${other.projectId}/sdk-config`)
      .expect(200);

    expect(otherConfig.body.data.i18n?.locale).toBeUndefined();
    expect(otherConfig.body.data.sdkConfigVersion).toBe(0);
  });

  it('rejects invalid translate-copy payloads', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post(`/v1/web/projects/${projectId}/sdk-config/translate-copy`)
      .send({
        sourceLocale: 'en',
        targetLocales: ['en'],
        sourceLabels: { headerTitle: 'Assistant' },
      })
      .expect(400);

    await request(server)
      .post(`/v1/web/projects/${projectId}/sdk-config/translate-copy`)
      .send({
        sourceLocale: 'en',
        targetLocales: [],
        sourceLabels: { headerTitle: 'Assistant' },
      })
      .expect(400);
  });

  it('returns BAD_GATEWAY when translate LLM output is not valid JSON', async () => {
    const server = app.getHttpServer();

    const res = await request(server)
      .post(`/v1/web/projects/${projectId}/sdk-config/translate-copy`)
      .send({
        sourceLocale: 'en',
        targetLocales: ['fr'],
        sourceLabels: {
          headerTitle: 'Assistant',
          placeholder: 'Type a message…',
        },
      })
      .expect(502);

    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('BAD_GATEWAY');
  });
});
