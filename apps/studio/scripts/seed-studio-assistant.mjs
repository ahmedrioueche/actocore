/**
 * Bootstrap the ActoCore Studio product assistant (platform-owned SDK project).
 * Seeds knowledge from _docs/studio/assistant/*.md
 * Run with backend up: npm run setup:assistant
 */
import { readdir, readFile } from 'fs/promises';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

import { getApiKey, getBaseUrl, loadStudioEnv, writeStudioEnv } from './lib/studio-env.mjs';
import { requestJson, setStudioAccessToken } from './lib/studio-api.mjs';

const PROJECT_NAME = 'ActoCore Studio Assistant';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = join(__dirname, '../../../_docs/studio/assistant');

loadStudioEnv();

const baseUrl = getBaseUrl();

function titleFromMarkdown(content, filename) {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  return basename(filename, '.md')
    .replace(/^\d+-/, '')
    .replace(/-/g, ' ');
}

async function loadKnowledgeArticles() {
  let files;
  try {
    files = (await readdir(KNOWLEDGE_DIR))
      .filter((name) => name.endsWith('.md') && name.toLowerCase() !== 'readme.md')
      .sort();
  } catch (err) {
    throw new Error(
      `Knowledge folder not found at ${KNOWLEDGE_DIR}: ${err.message}`,
    );
  }

  if (files.length === 0) {
    throw new Error(`No .md files in ${KNOWLEDGE_DIR}`);
  }

  const articles = [];
  for (const file of files) {
    const content = (await readFile(join(KNOWLEDGE_DIR, file), 'utf8')).trim();
    articles.push({
      title: titleFromMarkdown(content, file),
      content,
    });
  }
  return articles;
}

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

async function fetchProject(projectId) {
  const res = await requestJson('GET', `/v1/web/projects/${projectId}`);
  return res.data;
}

async function validateAssistantProject(projectId) {
  const project = await fetchProject(projectId);
  if (project.name !== PROJECT_NAME) {
    throw new Error(
      `Your VITE_ACTOCORE_API_KEY points at project "${project.name}" (${projectId}), not "${PROJECT_NAME}". ` +
        'Remove VITE_ACTOCORE_API_KEY from apps/studio/.env and re-run npm run setup:assistant to create a dedicated assistant project.',
    );
  }
  console.log(`  verified project name: ${PROJECT_NAME}`);
}

async function listKnowledgeTitles(projectId) {
  const list = await requestJson(
    'GET',
    `/v1/web/projects/${projectId}/knowledge?limit=100`,
  );
  const rows = list.data?.items ?? [];
  return new Set(rows.map((row) => row.title));
}

async function warnForeignKnowledge(projectId, expectedTitles) {
  const list = await requestJson(
    'GET',
    `/v1/web/projects/${projectId}/knowledge?limit=100`,
  );
  const rows = list.data?.items ?? [];
  const foreign = rows
    .map((row) => row.title)
    .filter((title) => !expectedTitles.has(title));

  if (foreign.length === 0) {
    return;
  }

  console.warn('\n  WARNING: assistant project has knowledge not from _docs/studio/assistant/:');
  for (const title of foreign) {
    console.warn(`    - ${title}`);
  }
  console.warn(
    '  Remove these in Studio → Knowledge for the assistant project to avoid wrong answers.\n',
  );
}

async function ensureKnowledge(projectId) {
  const existingTitles = await listKnowledgeTitles(projectId);
  const articles = await loadKnowledgeArticles();
  let uploaded = 0;

  for (const article of articles) {
    if (existingTitles.has(article.title)) {
      console.log(`  knowledge skip: ${article.title}`);
      continue;
    }

    const created = await requestJson(
      'POST',
      `/v1/web/projects/${projectId}/knowledge`,
      {
        type: 'text',
        title: article.title,
        content: article.content,
      },
    );
    if (created.data?.status === 'error') {
      throw new Error(created.data.errorMessage ?? `Ingest failed: ${article.title}`);
    }
    console.log(`  uploaded: ${article.title}`);
    uploaded += 1;
  }

  if (uploaded === 0 && articles.length > 0) {
    console.log('  all knowledge articles already present');
  }
}

async function main() {
  console.log(`=== ActoCore Studio assistant setup (${baseUrl}) ===\n`);
  await ensureStudioAccessToken();
  const { projectId } = await ensureAssistantProject();
  await validateAssistantProject(projectId);
  const articles = await loadKnowledgeArticles();
  const expectedTitles = new Set(articles.map((a) => a.title));
  await ensureKnowledge(projectId);
  await warnForeignKnowledge(projectId, expectedTitles);
  console.log('\nDone. Restart Studio dev server if it is already running.');
  console.log(
    'Edit knowledge in _docs/studio/assistant/*.md then re-run npm run setup:assistant to add new articles.\n',
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
