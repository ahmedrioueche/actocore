import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAYGROUND_ACTIONS } from './playground-actions-catalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(root, '.env'));

const baseUrl = (
  process.env.ACTOCORE_API_URL ??
  process.env.VITE_ACTOCORE_API_URL ??
  'http://localhost:3000'
).replace(/\/$/, '');

async function requestJson(method, path, body, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  }
  if (!res.ok) {
    throw new Error(
      `${method} ${path} failed (${res.status}): ${json.message ?? text}`,
    );
  }
  return json;
}

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
  const apiKey =
    process.env.VITE_ACTOCORE_API_KEY?.trim() ||
    process.env.ACTOCORE_API_KEY?.trim();

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

  console.log('\nCreated playground project. Add to apps/sdk-playground/.env:\n');
  console.log(`VITE_ACTOCORE_PROJECT_ID=${projectId}`);
  console.log(`VITE_ACTOCORE_API_KEY=${keyRes.data.key}\n`);

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
