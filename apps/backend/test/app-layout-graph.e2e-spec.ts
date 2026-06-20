import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/common/bootstrap/configure-app';
import { AppModule } from '../src/app.module';
import { seedProjectAndApiKey } from './helpers/e2e-seed';
import { applyDefaultE2eEnv } from './helpers/e2e-env';

describe('App layout graph (e2e)', () => {
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

  it('creates pages, functionality, link, and graph layout', async () => {
    const server = app.getHttpServer();

    const pageA = await request(server)
      .post(`/v1/web/projects/${projectId}/app-pages`)
      .send({
        slug: 'settings',
        title: 'Settings',
        route: '/settings',
      })
      .expect(201);

    const pageB = await request(server)
      .post(`/v1/web/projects/${projectId}/app-pages`)
      .send({
        slug: 'projects',
        title: 'Projects',
        route: '/projects',
      })
      .expect(201);

    const pageAId = pageA.body.data.id as string;
    const pageBId = pageB.body.data.id as string;

    await request(server)
      .post(`/v1/web/projects/${projectId}/app-pages/${pageAId}/functionalities`)
      .send({
        id: 'delete_project',
        title: 'Delete project',
        description: 'Remove a project permanently from settings.',
      })
      .expect(201);

    const link = await request(server)
      .post(`/v1/web/projects/${projectId}/app-page-links`)
      .send({
        sourcePageId: pageBId,
        targetPageId: pageAId,
        label: 'Settings',
      })
      .expect(201);

    expect(link.body.data.sourcePageId).toBe(pageBId);

    await request(server)
      .patch(`/v1/web/projects/${projectId}/app-pages/graph-layout`)
      .send({
        positions: {
          [pageAId]: { x: 100, y: 200 },
          [pageBId]: { x: 400, y: 200 },
        },
      })
      .expect(200)
      .expect((res) => {
        const settings = res.body.data.find(
          (p: { id: string }) => p.id === pageAId,
        );
        expect(settings.graphPosition).toEqual({ x: 100, y: 200 });
      });

    const runtime = await request(server)
      .get('/v1/sdk/runtime')
      .set({ Authorization: `Bearer ${apiKey}` })
      .expect(200);

    expect(runtime.body.data.pages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'settings',
          functionalities: [
            expect.objectContaining({ id: 'delete_project' }),
          ],
        }),
      ]),
    );
    expect(runtime.body.data.pageLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourcePageId: pageBId,
          targetPageId: pageAId,
        }),
      ]),
    );
  });

  it('imports layout JSON with merge and replace modes', async () => {
    const server = app.getHttpServer();

    const layout = {
      formatVersion: '1.0',
      exportedAt: new Date().toISOString(),
      pages: [
        {
          slug: 'root',
          title: 'Root',
          route: '/',
          pageKind: 'container',
          description: 'Product map root',
          enabled: true,
          order: 0,
          parentPageSlug: null,
          graphPosition: { x: 0, y: 0 },
        },
        {
          slug: 'billing',
          title: 'Billing',
          route: '/billing',
          enabled: true,
          order: 1,
          parentPageSlug: 'root',
          graphPosition: { x: 200, y: 100 },
        },
        {
          slug: 'usage',
          title: 'Usage',
          route: '/usage',
          enabled: true,
          order: 2,
          parentPageSlug: 'root',
          graphPosition: { x: 400, y: 100 },
        },
      ],
      links: [
        {
          sourceSlug: 'billing',
          targetSlug: 'usage',
          label: 'View usage',
        },
      ],
    };

    const mergeResult = await request(server)
      .post(`/v1/web/projects/${projectId}/app-layout/import`)
      .send({ mode: 'merge', layout })
      .expect(201);

    expect(mergeResult.body.data.created).toBeGreaterThan(0);

    const afterMerge = await request(server)
      .get(`/v1/web/projects/${projectId}/app-pages`)
      .expect(200);

    const billing = afterMerge.body.data.find(
      (page: { slug: string }) => page.slug === 'billing',
    );
    const usage = afterMerge.body.data.find(
      (page: { slug: string }) => page.slug === 'usage',
    );
    expect(billing?.graphPosition).toEqual({ x: 200, y: 100 });
    expect(billing?.parentPageId).toBeTruthy();

    const linksAfterMerge = await request(server)
      .get(`/v1/web/projects/${projectId}/app-page-links`)
      .expect(200);
    expect(linksAfterMerge.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourcePageId: billing.id,
          targetPageId: usage.id,
          label: 'View usage',
        }),
      ]),
    );

    const replaceLayout = {
      ...layout,
      pages: layout.pages.filter(
        (page: { slug: string }) => page.slug !== 'usage',
      ),
      links: [],
    };

    await request(server)
      .post(`/v1/web/projects/${projectId}/app-layout/import`)
      .send({ mode: 'replace', layout: replaceLayout })
      .expect(201);

    const afterReplace = await request(server)
      .get(`/v1/web/projects/${projectId}/app-pages`)
      .expect(200);

    expect(
      afterReplace.body.data.some(
        (page: { slug: string }) => page.slug === 'usage',
      ),
    ).toBe(false);
    expect(
      afterReplace.body.data.some(
        (page: { slug: string }) => page.slug === 'billing',
      ),
    ).toBe(true);

    const linksAfterReplace = await request(server)
      .get(`/v1/web/projects/${projectId}/app-page-links`)
      .expect(200);
    expect(linksAfterReplace.body.data).toHaveLength(0);
  });
});
