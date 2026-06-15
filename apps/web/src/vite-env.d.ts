/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_STUDIO_URL?: string;
  readonly VITE_ACTOCORE_API_URL?: string;
  readonly VITE_MARKETING_CHAT_ENABLED?: string;
  readonly VITE_DEMO_VIDEO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
