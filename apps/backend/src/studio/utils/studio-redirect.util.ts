export function buildStudioAppUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string>,
): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function parseAllowedOrigin(
  rawOrigin: string | undefined,
  allowedOrigins: string[],
): string | undefined {
  if (!rawOrigin) {
    return undefined;
  }
  try {
    const origin = new URL(rawOrigin).origin;
    return allowedOrigins.includes(origin) ? origin : undefined;
  } catch {
    return undefined;
  }
}
