function parseOrigins(value: string | undefined, fallback: string[]): string[] {
  if (!value?.trim()) {
    return fallback;
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function resolveHttpConfig() {
  const devOrigins = ['http://localhost:3000', 'http://localhost:5173'];

  return {
    bodyLimitSdk: process.env.HTTP_BODY_LIMIT_SDK?.trim() ?? '2mb',
    bodyLimitWeb: process.env.HTTP_BODY_LIMIT_WEB?.trim() ?? '1mb',
    corsSdkOrigins: parseOrigins(process.env.CORS_SDK_ORIGINS, devOrigins),
    corsWebOrigins: parseOrigins(process.env.CORS_WEB_ORIGINS, devOrigins),
    studioWebRateLimitPerMinute: parseInt(
      process.env.STUDIO_WEB_RATE_LIMIT_PER_MINUTE ?? '120',
      10,
    ),
  };
}
