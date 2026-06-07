export const PROJECT_DOCS_INSTALL_COMMAND =
  'npm install @ahmedrioueche/actocore-sdk';

export const PROJECT_DOCS_QUICK_START = `import { ActocoreProvider, ActoChatWidget } from '@ahmedrioueche/actocore-sdk';
import '@ahmedrioueche/actocore-sdk/styles.css';

export function App() {
  return (
    <ActocoreProvider
      apiKey={import.meta.env.VITE_ACTOCORE_API_KEY}
      baseURL={import.meta.env.VITE_ACTOCORE_API_URL}
      loadRemoteConfig
      actions={{
        // Register handlers for actions you define in Studio
      }}
    >
      <ActoChatWidget />
    </ActocoreProvider>
  );
}`;

export const PROJECT_DOCS_ENV_EXAMPLE = `# .env (Vite example)
VITE_ACTOCORE_API_URL=https://your-actocore-api.example.com
VITE_ACTOCORE_API_KEY=ac_...`;
