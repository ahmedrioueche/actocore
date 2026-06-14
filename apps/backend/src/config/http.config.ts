import { getAppEnvironment } from './mongodb.config';
import {
  inferActocoreOriginPattern,
  splitExactOriginsAndPatterns,
} from './cors-origin.util';

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

  const sdkOriginList = parseOrigins(process.env.CORS_SDK_ORIGINS, defaultOrigins);
  const webOriginList = uniqueOrigins(
    parseOrigins(process.env.CORS_WEB_ORIGINS, defaultOrigins),
    studioAppUrl ? [studioAppUrl] : [],
  );
  const actocorePattern = inferActocoreOriginPattern(studioAppUrl);
  const patternList = uniqueOrigins(
    parseOrigins(process.env.CORS_ORIGIN_PATTERNS, []),
    actocorePattern ? [actocorePattern] : [],
  );

  const sdkSplit = splitExactOriginsAndPatterns(sdkOriginList);
  const webSplit = splitExactOriginsAndPatterns(webOriginList);
  const patternSplit = splitExactOriginsAndPatterns(patternList);

  return {
    bodyLimitSdk: process.env.HTTP_BODY_LIMIT_SDK?.trim() ?? '2mb',
    bodyLimitWeb: process.env.HTTP_BODY_LIMIT_WEB?.trim() ?? '1mb',
    corsAllowedOrigins: uniqueOrigins(
      sdkSplit.exact,
      webSplit.exact,
      patternSplit.exact,
    ),
    corsOriginPatterns: uniqueOrigins(
      sdkSplit.patterns,
      webSplit.patterns,
      patternSplit.patterns,
    ),
    /** @deprecated use corsAllowedOrigins — kept for callers that still read these */
    corsSdkOrigins: sdkOriginList,
    corsWebOrigins: webOriginList,
    studioWebRateLimitPerMinute: parseInt(
      process.env.STUDIO_WEB_RATE_LIMIT_PER_MINUTE ?? '120',
      10,
    ),
  };
}
