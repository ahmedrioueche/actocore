import { ActoChatWidget, ActocoreProvider } from '@ahmedrioueche/actocore-sdk';
import type { ActocoreI18nConfig } from '@ahmedrioueche/actocore-sdk';
import { memo, useMemo } from 'react';

import { getActocoreApiUrl } from '@/lib/marketing-chat';

import { PlaygroundHostContextSync } from './PlaygroundHostContextSync';
import type { createPlaygroundActions } from './playground-actions';
import type { PlaygroundProjectCredentials } from './playground-project';

type PlaygroundChatPanelProps = {
  credentials: PlaygroundProjectCredentials;
  chatUserId: string;
  locale: string;
  sdkTranslations: NonNullable<ActocoreI18nConfig['translations']>;
  clientActions: ReturnType<typeof createPlaygroundActions>;
  hostRoute: { currentPage: string; route: string };
  remoteConfigVersion: number;
};

export const PlaygroundChatPanel = memo(function PlaygroundChatPanel({
  credentials,
  chatUserId,
  locale,
  sdkTranslations,
  clientActions,
  hostRoute,
  remoteConfigVersion,
}: PlaygroundChatPanelProps) {
  const providerI18n = useMemo(
    () => ({
      locale,
      translations: sdkTranslations,
    }),
    [locale, sdkTranslations],
  );

  return (
    <div className="playground-chat-widget">
      <ActocoreProvider
        apiKey={credentials.apiKey}
        baseURL={getActocoreApiUrl()}
        loadRemoteConfig
        remoteConfigVersion={remoteConfigVersion}
        persistSession
        externalUserId={chatUserId}
        hostContext={hostRoute}
        i18n={providerI18n}
        actions={clientActions}
      >
        <PlaygroundHostContextSync
          currentPage={hostRoute.currentPage}
          route={hostRoute.route}
        />
        <ActoChatWidget zIndex={60} />
      </ActocoreProvider>
    </div>
  );
});
