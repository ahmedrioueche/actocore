/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACTOCORE_API_URL: string;
  readonly VITE_STUDIO_FEATURE_TEST_ACCOUNTS?: string;
  readonly VITE_TERMS_URL?: string;
  readonly VITE_PRIVACY_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
  readonly VITE_SENTRY_ENABLED?: string;
  readonly VITE_CLARITY_PROJECT_ID?: string;
  readonly VITE_CLARITY_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
