import { getAppEnvironment } from './mongodb.config';

function parseOrigins(value: string | undefined, fallback: string[]): string[] {
  if (!value?.trim()) {
    return fallback;
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function uniqueOrigins(...lists: string[][]): string[] {
  return [...new Set(lists.flat().filter(Boolean))];
}

export function resolveHttpConfig() {
  const nodeEnv = getAppEnvironment();
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ];
  const defaultOrigins = nodeEnv === 'production' ? [] : devOrigins;
  const studioAppUrl = process.env.STUDIO_APP_URL?.trim();

  return {
    bodyLimitSdk: process.env.HTTP_BODY_LIMIT_SDK?.trim() ?? '2mb',
    bodyLimitWeb: process.env.HTTP_BODY_LIMIT_WEB?.trim() ?? '1mb',
    corsSdkOrigins: parseOrigins(process.env.CORS_SDK_ORIGINS, defaultOrigins),
    corsWebOrigins: uniqueOrigins(
      parseOrigins(process.env.CORS_WEB_ORIGINS, defaultOrigins),
      studioAppUrl ? [studioAppUrl] : [],
    ),
    studioWebRateLimitPerMinute: parseInt(
      process.env.STUDIO_WEB_RATE_LIMIT_PER_MINUTE ?? '120',
      10,
    ),
  };
}
