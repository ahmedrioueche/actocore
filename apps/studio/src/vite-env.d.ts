/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACTOCORE_API_URL: string;
  readonly VITE_STUDIO_FEATURE_TEST_ACCOUNTS?: string;
  readonly VITE_TERMS_URL?: string;
  readonly VITE_PRIVACY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
