import { PLAYGROUND_ACTIONS } from './playground-actions-catalog.mjs';
import { requestJson } from './lib/playground-api.mjs';
import {
  getApiKey,
  getBaseUrl,
  loadPlaygroundEnv,
  writePlaygroundEnv,
} from './lib/playground-env.mjs';

loadPlaygroundEnv();

const baseUrl = getBaseUrl();

async function resolveProjectFromApiKey(apiKey) {
  const runtime = await requestJson('GET', '/v1/sdk/runtime', undefined, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const projectId = runtime.data?.projectId;
  if (!projectId) {
    throw new Error('SDK runtime did not return projectId');
  }
  console.log(`  project ${projectId} (from API key)`);
  return projectId;
}

async function ensureProject() {
  const apiKey = getApiKey();

  if (apiKey) {
    return resolveProjectFromApiKey(apiKey);
  }

  const existing = process.env.VITE_ACTOCORE_PROJECT_ID?.trim();
  if (existing) {
    await requestJson('GET', `/v1/web/projects/${existing}`);
    console.log(`  project ${existing} (from VITE_ACTOCORE_PROJECT_ID)`);
    return existing;
  }

  const created = await requestJson('POST', '/v1/web/projects', {
    name: 'SDK Playground Demo',
  });
  const projectId = created.data.id;

  const keyRes = await requestJson('POST', '/v1/web/api-keys', {
    projectId,
    name: 'playground',
  });

  writePlaygroundEnv({
    VITE_ACTOCORE_API_URL: baseUrl,
    VITE_ACTOCORE_PROJECT_ID: projectId,
    VITE_ACTOCORE_API_KEY: keyRes.data.key,
  });

  process.env.VITE_ACTOCORE_API_KEY = keyRes.data.key;
  process.env.VITE_ACTOCORE_PROJECT_ID = projectId;

  return projectId;
}

async function upsertAction(projectId, action) {
  const list = await requestJson('GET', `/v1/web/projects/${projectId}/actions`);
  const existing = list.data?.find((a) => a.name === action.name);

  if (existing) {
    await requestJson(
      'PATCH',
      `/v1/web/projects/${projectId}/actions/${existing.id}`,
      {
        description: action.description,
        inputSchema: action.inputSchema,
        enabled: true,
      },
    );
    console.log(`  updated ${action.name}`);
    return;
  }

  await requestJson('POST', `/v1/web/projects/${projectId}/actions`, {
    ...action,
    enabled: true,
  });
  console.log(`  created ${action.name}`);
}

async function main() {
  console.log(`Seeding playground actions at ${baseUrl} ...`);
  const projectId = await ensureProject();

  for (const action of PLAYGROUND_ACTIONS) {
    await upsertAction(projectId, action);
  }

  console.log('\nDone. Example chat prompts (action intent):');
  console.log('  Run add_user {"email":"jane@demo.com","name":"Jane Doe"}');
  console.log('  Run delete_user {"email":"bob@demo.com"}');
  console.log('  Run update_user {"email":"alice@demo.com","name":"Alice K."}');
  console.log('  Run list_users');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
