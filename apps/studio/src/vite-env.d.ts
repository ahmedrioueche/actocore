/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACTOCORE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
