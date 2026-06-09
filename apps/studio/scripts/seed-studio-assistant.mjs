/**
 * Bootstrap the ActoCore Studio product assistant (platform-owned SDK project).
 * Run with backend up: npm run setup:assistant
 */
import { getApiKey, getBaseUrl, loadStudioEnv, writeStudioEnv } from './lib/studio-env.mjs';
import { requestJson, setStudioAccessToken } from './lib/studio-api.mjs';

const PROJECT_NAME = 'ActoCore Studio Assistant';
const KNOWLEDGE_TITLE = 'ActoCore Studio help';

const STUDIO_HELP_TEXT = `
ActoCore Studio is the web dashboard for configuring AI assistants in your applications.

Key areas:
- Projects: create apps and manage API keys, knowledge, actions, and SDK settings.
- Knowledge: upload documents and URLs so your assistant can answer from your content.
- Actions: define tools the assistant can call; implement handlers in your app with the SDK.
- SDK config: customize theme, copy, and UI for the embedded chat widget (loadRemoteConfig in ActocoreProvider).
- Team: invite members and assign project access.
- Billing and subscription: view usage, plans, and payment history.

Integration: install @ahmedrioueche/actocore-sdk, set apiKey and baseURL on ActocoreProvider, register action handlers, enable loadRemoteConfig to apply dashboard SDK settings.
`.trim();

loadStudioEnv();

const baseUrl = getBaseUrl();

async function ensureStudioAccessToken() {
  const fromEnv =
    process.env.STUDIO_ACCESS_TOKEN?.trim() ||
    process.env.ACTOCORE_STUDIO_TOKEN?.trim();
  if (fromEnv) {
    setStudioAccessToken(fromEnv);
    return;
  }

  const email = process.env.STUDIO_SETUP_EMAIL?.trim();
  const password = process.env.STUDIO_SETUP_PASSWORD?.trim();
  if (email && password) {
    const login = await requestJson('POST', '/v1/web/auth/login', {
      email,
      password,
    });
    setStudioAccessToken(login.data.accessToken);
    console.log('  signed in for setup');
    return;
  }

  throw new Error(
    'Studio auth is enabled. Set STUDIO_SETUP_EMAIL + STUDIO_SETUP_PASSWORD in apps/studio/.env (your Studio login), or STUDIO_ACCESS_TOKEN, then re-run npm run setup:assistant',
  );
}

async function resolveProjectFromApiKey(apiKey) {
  const runtime = await requestJson('GET', '/v1/sdk/runtime', undefined, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const projectId = runtime.data?.projectId;
  if (!projectId) {
    throw new Error('SDK runtime did not return projectId');
  }
  console.log(`  project ${projectId} (from existing API key)`);
  return projectId;
}

async function ensureAssistantProject() {
  const apiKey = getApiKey();

  if (apiKey) {
    const projectId = await resolveProjectFromApiKey(apiKey);
    return { projectId, apiKey };
  }

  const existingProjectId = process.env.VITE_ACTOCORE_ASSISTANT_PROJECT_ID?.trim();
  if (existingProjectId) {
    await requestJson('GET', `/v1/web/projects/${existingProjectId}`);
    const keyRes = await requestJson('POST', '/v1/web/api-keys', {
      projectId: existingProjectId,
      name: 'studio-assistant',
    });
    writeStudioEnv({
      VITE_ACTOCORE_API_URL: baseUrl,
      VITE_ACTOCORE_ASSISTANT_PROJECT_ID: existingProjectId,
      VITE_ACTOCORE_API_KEY: keyRes.data.key,
    });
    console.log(`  project ${existingProjectId} (reused)`);
    return { projectId: existingProjectId, apiKey: keyRes.data.key };
  }

  const created = await requestJson('POST', '/v1/web/projects', {
    name: PROJECT_NAME,
  });
  const projectId = created.data.id;

  const keyRes = await requestJson('POST', '/v1/web/api-keys', {
    projectId,
    name: 'studio-assistant',
  });

  writeStudioEnv({
    VITE_ACTOCORE_API_URL: baseUrl,
    VITE_ACTOCORE_ASSISTANT_PROJECT_ID: projectId,
    VITE_ACTOCORE_API_KEY: keyRes.data.key,
  });

  console.log(`  created project ${projectId}`);
  return { projectId, apiKey: keyRes.data.key };
}

async function ensureKnowledge(projectId) {
  const list = await requestJson(
    'GET',
    `/v1/web/projects/${projectId}/knowledge`,
  );
  const existing = list.data?.find((row) => row.title === KNOWLEDGE_TITLE);
  if (existing) {
    console.log('  knowledge already seeded');
    return;
  }

  const created = await requestJson(
    'POST',
    `/v1/web/projects/${projectId}/knowledge`,
    {
      type: 'text',
      title: KNOWLEDGE_TITLE,
      content: STUDIO_HELP_TEXT,
    },
  );
  if (created.data?.status === 'error') {
    throw new Error(created.data.errorMessage ?? 'Knowledge ingest failed');
  }
  console.log('  uploaded Studio help knowledge');
}

async function main() {
  console.log(`=== ActoCore Studio assistant setup (${baseUrl}) ===\n`);
  await ensureStudioAccessToken();
  const { projectId } = await ensureAssistantProject();
  await ensureKnowledge(projectId);
  console.log('\nDone. Restart Studio dev server if it is already running.');
  console.log('The ActoCore Assistant widget appears after login when VITE_ACTOCORE_API_KEY is set.\n');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
