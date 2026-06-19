import { useTranslation } from 'react-i18next';

import { DocCodeBlock } from '@/components/projects/DocCodeBlock';

const HOST_LAUNCHER_SNIPPET = `import {
  ActocoreProvider,
  ActoChatLauncher,
  ActoChatWidgetProvider,
  ActoChatWidgetPanel,
} from '@ahmedrioueche/actocore-sdk';

export function AppShell() {
  return (
    <ActocoreProvider apiKey={apiKey} baseURL={apiUrl} loadRemoteConfig>
      <ActoChatWidgetProvider>
        <header className="app-header">
          <nav>...</nav>
          <ActoChatLauncher />
        </header>
        <main>...</main>
        <ActoChatWidgetPanel />
      </ActoChatWidgetProvider>
    </ActocoreProvider>
  );
}`;

export function SdkHostLauncherSnippet() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-sm font-medium text-text-primary">
        {t('sdkConfig.fields.hostLauncherSnippetTitle')}
      </p>
      <p className="text-xs text-text-secondary">
        {t('sdkConfig.fields.hostLauncherSnippetHint')}
      </p>
      <DocCodeBlock
        label={t('sdkConfig.fields.hostLauncherSnippetLabel')}
        code={HOST_LAUNCHER_SNIPPET}
      />
    </div>
  );
}
