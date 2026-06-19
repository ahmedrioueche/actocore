export const PROJECT_DOCS_INSTALL_COMMAND =
  "npm install @ahmedrioueche/actocore-sdk";

export const PROJECT_DOCS_UPDATE_COMMAND =
  "npm install @ahmedrioueche/actocore-sdk@latest";

export const PROJECT_DOCS_VERIFY_COMMAND =
  "npm ls @ahmedrioueche/actocore-sdk @ahmedrioueche/actocore-shared";

export function projectDocsPinnedInstallCommand(version: string): string {
  return `npm install @ahmedrioueche/actocore-sdk@${version}`;
}

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

export const PROJECT_DOCS_HOST_LAUNCHER = `import {
  ActocoreProvider,
  ActoChatLauncher,
  ActoChatWidgetProvider,
  ActoChatWidgetPanel,
} from '@ahmedrioueche/actocore-sdk';

export function AppShell() {
  return (
    <ActocoreProvider apiKey={apiKey} baseURL={apiUrl} loadRemoteConfig>
      <ActoChatWidgetProvider>
        <header>
          <nav>...</nav>
          <ActoChatLauncher />
        </header>
        <main>...</main>
        <ActoChatWidgetPanel />
      </ActoChatWidgetProvider>
    </ActocoreProvider>
  );
}`;

export const PROJECT_DOCS_ENV_EXAMPLE = `# .env (Vite example)
VITE_ACTOCORE_API_URL=https://actocore.onrender.com
VITE_ACTOCORE_API_KEY=ac_...`;

export const PROJECT_DOCS_LOCALE_SYNC = `import { useTranslation } from 'react-i18next';
import { ActocoreProvider, ActoChatWidget } from '@ahmedrioueche/actocore-sdk';

export function App() {
  const { i18n } = useTranslation();
  const locale = i18n.language?.split('-')[0] ?? 'en';

  return (
    <ActocoreProvider
      apiKey={import.meta.env.VITE_ACTOCORE_API_KEY}
      baseURL={import.meta.env.VITE_ACTOCORE_API_URL}
      loadRemoteConfig
      i18n={{ locale }}
    >
      <ActoChatWidget />
    </ActocoreProvider>
  );
}`;
