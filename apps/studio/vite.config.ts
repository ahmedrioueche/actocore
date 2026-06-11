import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const sharedRoot = fileURLToPath(
  new URL("../../packages/shared", import.meta.url),
);
const sdkRoot = fileURLToPath(new URL("../../packages/sdk", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@ahmedrioueche/actocore-shared": fileURLToPath(
        new URL("../../packages/shared/src/index.ts", import.meta.url),
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["reflect-metadata"],
    exclude: ["@ahmedrioueche/actocore-shared"],
  },
  server: {
    fs: {
      allow: [appRoot, sharedRoot, sdkRoot],
    },
    port: 5174,
  },
});
