import { getAppEnvironment } from './mongodb.config';

const DEFAULT_REDIS_URL = 'redis://localhost:6379';

export function resolveRedisUrl(): string | undefined {
  if (process.env.REDIS_URL !== undefined) {
    const explicit = process.env.REDIS_URL.trim();
    return explicit || undefined;
  }

  if (getAppEnvironment() === 'development') {
    return DEFAULT_REDIS_URL;
  }

  return undefined;
}

export function isRedisEnabled(): boolean {
  return resolveRedisUrl() != null;
}
