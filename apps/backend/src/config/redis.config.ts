import { getAppEnvironment } from './mongodb.config';

const DEFAULT_REDIS_URL = 'redis://localhost:6379';

export function resolveRedisUrl(): string | undefined {
  const explicit = process.env.REDIS_URL?.trim();
  if (explicit) {
    return explicit;
  }

  if (getAppEnvironment() === 'development') {
    return DEFAULT_REDIS_URL;
  }

  return undefined;
}

export function isRedisEnabled(): boolean {
  return resolveRedisUrl() != null;
}
