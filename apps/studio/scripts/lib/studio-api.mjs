import { getBaseUrl } from './studio-env.mjs';

let cachedStudioToken = null;

export function setStudioAccessToken(token) {
  cachedStudioToken = token?.trim() || null;
}

function studioHeadersForPath(path) {
  if (!path.includes('/web/')) {
    return {};
  }
  const token =
    cachedStudioToken ||
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
