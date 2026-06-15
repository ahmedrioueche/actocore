import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARKETING_HERO_KNOWLEDGE } from './marketing-playground-catalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');
const repoRoot = join(webRoot, '../..');

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

loadEnvFile(join(repoRoot, 'apps/backend/.env'));
loadEnvFile(join(webRoot, '.env'));

const baseUrl = (
  process.env.ACTOCORE_API_URL ??
  process.env.VITE_ACTOCORE_API_URL ??
  'http://localhost:3000'
).replace(/\/$/, '');

let studioAccessToken = '';

async function requestJson(method, path, body, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (path.includes('/web/') && studioAccessToken) {
    headers.Authorization = `Bearer ${studioAccessToken}`;
  }
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

async function ensureStudioAccessToken() {
  const fromEnv =
    process.env.STUDIO_ACCESS_TOKEN?.trim() ||
    process.env.ACTOCORE_STUDIO_TOKEN?.trim();
  if (fromEnv) {
    studioAccessToken = fromEnv;
    return;
  }

  const email = process.env.STUDIO_SETUP_EMAIL?.trim();
  const password = process.env.STUDIO_SETUP_PASSWORD?.trim();
  if (email && password) {
    const login = await requestJson('POST', '/v1/web/auth/login', {
      email,
      password,
    });
    studioAccessToken = login.data.accessToken;
    console.log('  signed in for setup');
    return;
  }

  throw new Error(
    'Set STUDIO_SETUP_EMAIL + STUDIO_SETUP_PASSWORD (or STUDIO_ACCESS_TOKEN) to seed the marketing hero project via web API.',
  );
}

function resolveMarketingProjectId() {
  const projectId = process.env.MARKETING_CHAT_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error(
      'Set MARKETING_CHAT_PROJECT_ID in apps/backend/.env to the hero chat project id.',
    );
  }
  return projectId;
}

async function upsertKnowledge(projectId, source) {
  const list = await requestJson('GET', `/v1/web/projects/${projectId}/knowledge`);
  const existing = list.data?.find((item) => item.title === source.title);
  if (existing) {
    await requestJson(
      'DELETE',
      `/v1/web/projects/${projectId}/knowledge/${existing.id}`,
    );
  }

  const created = await requestJson(
    'POST',
    `/v1/web/projects/${projectId}/knowledge`,
    source,
  );
  const data = created.data;
  console.log(
    `  knowledge "${source.title}" — ${data.status}, ${data.chunkCount} chunk(s)`,
  );
  if (data.status === 'error') {
    throw new Error(data.errorMessage ?? 'Knowledge ingestion failed');
  }
}

async function main() {
  console.log(`Seeding marketing hero chat project at ${baseUrl} ...`);
  await ensureStudioAccessToken();
  const projectId = resolveMarketingProjectId();
  await requestJson('GET', `/v1/web/projects/${projectId}`);
  console.log(`  project ${projectId}`);

  for (const source of MARKETING_HERO_KNOWLEDGE) {
    await upsertKnowledge(projectId, source);
  }

  console.log('\nDone. Hero chat uses this project; playground visitors get their own projects at bootstrap.');
  console.log('\nEnsure backend .env has:');
  console.log('  MARKETING_CHAT_ENABLED=true');
  console.log('  PLAYGROUND_ENABLED=true');
  console.log(`  MARKETING_CHAT_PROJECT_ID=${projectId}`);
  console.log('  MARKETING_CHAT_ALLOWED_ORIGINS=http://localhost:3001');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
