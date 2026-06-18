import * as Sentry from '@sentry/nestjs';

import type { SentryConfig } from '../config/sentry.config';
import { resolveSentryConfig } from '../config/sentry.config';

let initialized = false;

export function initSentry(config: SentryConfig = resolveSentryConfig()): void {
  if (initialized || !config.enabled || !config.dsn) {
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    tracesSampleRate: config.tracesSampleRate,
  });

  initialized = true;
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export function captureSentryException(
  exception: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
): void {
  if (!initialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(exception);
  });
}
