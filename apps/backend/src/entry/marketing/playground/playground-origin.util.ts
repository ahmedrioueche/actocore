import type { Request } from 'express';

export function normalizeRequestOrigin(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function resolveRequestOrigin(request: Request): string | null {
  const headerOrigin = normalizeRequestOrigin(request.headers.origin);
  if (headerOrigin) {
    return headerOrigin;
  }

  const referer = request.headers.referer;
  if (typeof referer === 'string') {
    return normalizeRequestOrigin(referer);
  }

  return null;
}

export function extractPlaygroundToken(request: Request): string | null {
  const header = request.headers['x-playground-token'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }

  const authorization = request.headers.authorization;
  if (typeof authorization === 'string') {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1]?.trim();
    if (token?.startsWith('pg_')) {
      return token;
    }
  }

  return null;
}
