/// <reference types="vite/client" />

declare module '@actocore/shared-assets/*.svg' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_ACTOCORE_API_URL: string;
  readonly VITE_TERMS_URL?: string;
  readonly VITE_PRIVACY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
