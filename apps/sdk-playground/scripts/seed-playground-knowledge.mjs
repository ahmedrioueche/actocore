import { readFileSync, existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAYGROUND_KNOWLEDGE } from './playground-knowledge-catalog.mjs';

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

async function upsertKnowledgeSource(projectId, source) {
  const list = await requestJson(
    'GET',
    `/v1/web/projects/${projectId}/knowledge`,
  );
  const existing = list.data?.find((s) => s.title === source.title);

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
    `  ${existing ? 'replaced' : 'created'} "${source.title}" — ${data.status}, ${data.chunkCount} chunk(s)`,
  );
  if (data.status === 'error') {
    throw new Error(data.errorMessage ?? 'Ingestion failed');
  }
}

async function uploadKnowledgeFile(projectId, filePath, title) {
  const resolved = join(process.cwd(), filePath);
  if (!existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }

  const buffer = readFileSync(resolved);
  const filename = basename(resolved);
  const docTitle =
    title?.trim() || filename.replace(/\.[^.]+$/, '') || 'Document';

  const list = await requestJson(
    'GET',
    `/v1/web/projects/${projectId}/knowledge`,
  );
  const existing = list.data?.find((s) => s.title === docTitle);
  if (existing) {
    await requestJson(
      'DELETE',
      `/v1/web/projects/${projectId}/knowledge/${existing.id}`,
    );
  }

  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);

  const params = new URLSearchParams({ title: docTitle });
  const res = await fetch(
    `${baseUrl}/v1/web/projects/${projectId}/knowledge/upload?${params}`,
    { method: 'POST', body: form },
  );
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`upload failed (${res.status}): ${text}`);
  }
  if (!res.ok) {
    throw new Error(`upload failed (${res.status}): ${json.message ?? text}`);
  }

  const data = json.data;
  console.log(
    `  uploaded "${docTitle}" (${filename}) — ${data.status}, ${data.chunkCount} chunk(s)`,
  );
  if (data.status === 'error') {
    throw new Error(data.errorMessage ?? 'Ingestion failed');
  }
}

function parseCliUploads(argv) {
  const paths = [];
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (
      (arg === '--upload' || arg === '--file' || arg === '--pdf') &&
      argv[i + 1]
    ) {
      paths.push(argv[++i]);
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/seed-playground-knowledge.mjs [options]

Seeds demo text knowledge for the playground project (from VITE_ACTOCORE_API_KEY).

Options:
  --upload <path>  Upload PDF, .txt, or .md via Core multipart API (recommended)
  --file <path>    Alias for --upload
  --pdf <path>     Alias for --upload (backend extracts text)
  -h, --help       Show this help
`);
      process.exit(0);
    }
  }
  return paths;
}

async function main() {
  const uploadPaths = parseCliUploads(process.argv);
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    return;
  }

  console.log(`Seeding playground knowledge at ${baseUrl} ...`);
  const projectId = await ensureProject();

  for (const source of PLAYGROUND_KNOWLEDGE) {
    await upsertKnowledgeSource(projectId, source);
  }

  for (const filePath of uploadPaths) {
    await uploadKnowledgeFile(projectId, filePath);
  }

  console.log('\nDone. Example Knowledge (Q&A) prompts in the playground chat:');
  console.log('  What is ActoCore?');
  console.log('  How do I add a user in the playground?');
  console.log('  Tell me about demo users');
  if (uploadPaths.length === 0) {
    console.log('\nTo upload a file via the backend API:');
    console.log('  npm run seed:knowledge -- --upload ./docs/manual.pdf');
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
