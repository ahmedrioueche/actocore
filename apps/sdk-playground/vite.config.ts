import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('.', import.meta.url));
const sdkRoot = fileURLToPath(new URL('../../packages/sdk', import.meta.url));
const sharedRoot = fileURLToPath(
  new URL('../../packages/shared', import.meta.url),
);
const sharedAssetsRoot = fileURLToPath(
  new URL('../../packages/shared/assets', import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@actocore/shared-assets': sharedAssetsRoot,
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['@ahmedrioueche/actocore-shared'],
  },
  server: {
    fs: {
      allow: [appRoot, sdkRoot, sharedRoot, sharedAssetsRoot],
    },
  },
});

