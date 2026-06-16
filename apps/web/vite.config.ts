import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const appRoot = fileURLToPath(new URL('.', import.meta.url));
const brandRoot = fileURLToPath(new URL('../../packages/brand', import.meta.url));
const sharedRoot = fileURLToPath(new URL('../../packages/shared', import.meta.url));
const sdkRoot = fileURLToPath(new URL('../../packages/sdk', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@ahmedrioueche/actocore-shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
      '@ahmedrioueche/actocore-sdk/styles.css': fileURLToPath(
        new URL('../../packages/sdk/src/styles/styles.css', import.meta.url),
      ),
      '@ahmedrioueche/actocore-sdk': fileURLToPath(
        new URL('../../packages/sdk/src/index.ts', import.meta.url),
      ),
    },
    dedupe: ['react', 'react-dom', 'i18next', 'react-i18next'],
  },
  optimizeDeps: {
    include: ['reflect-metadata'],
    exclude: ['@ahmedrioueche/actocore-shared', '@ahmedrioueche/actocore-sdk'],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 800,
  },
  server: {
    fs: {
      allow: [appRoot, brandRoot, sharedRoot, sdkRoot],
    },
    port: 3001,
  },
});
