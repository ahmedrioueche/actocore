import { getApiKey, getBaseUrl } from './playground-env.mjs';

function studioHeadersForPath(path) {
  if (!path.includes('/web/')) {
    return {};
  }
  const token =
    process.env.STUDIO_ACCESS_TOKEN?.trim() ||
    process.env.ACTOCORE_STUDIO_TOKEN?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function requestJson(method, path, body, options = {}) {
  const baseUrl = getBaseUrl();
  const headers = {
    ...studioHeadersForPath(path),
    ...(options.headers ?? {}),
  };
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

export async function resolveProjectId() {
  const fromEnv = process.env.VITE_ACTOCORE_PROJECT_ID?.trim();
  if (fromEnv) {
    await requestJson('GET', `/v1/web/projects/${fromEnv}`);
    return fromEnv;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'Missing API key. Run: npm run setup (or npm run seed:actions with backend up)',
    );
  }

  const runtime = await requestJson('GET', '/v1/sdk/runtime', undefined, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const projectId = runtime.data?.projectId;
  if (!projectId) {
    throw new Error('GET /v1/sdk/runtime did not return projectId');
  }
  return projectId;
}
