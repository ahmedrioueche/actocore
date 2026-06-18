import * as Sentry from '@sentry/react';

let initialized = false;

function parseSampleRate(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return fallback;
  }
  return value;
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  const explicitlyDisabled =
    import.meta.env.VITE_SENTRY_ENABLED?.trim().toLowerCase() === 'false';

  if (!dsn || explicitlyDisabled || initialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() || import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: parseSampleRate(
      import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
      0.1,
    ),
  });

  initialized = true;
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export function captureAppException(
  error: unknown,
  context?: { componentStack?: string | null },
): void {
  if (!initialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.componentStack) {
      scope.setExtra('componentStack', context.componentStack);
    }
    Sentry.captureException(error);
  });
}
