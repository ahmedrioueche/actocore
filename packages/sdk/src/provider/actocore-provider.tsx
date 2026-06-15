import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import {
  configureApi,
  enrichHostContext,
  runtimeApi,
} from '@ahmedrioueche/actocore-shared';
import type {
  AppPageManifestEntry,
  HostContext,
  SdkRuntimeConfigData,
} from '@ahmedrioueche/actocore-shared';
import type { ActocoreSdkConfig } from '../config/types';
import { mergeRemoteSdkConfig } from '../config/merge-remote-sdk-config';
import { resolveConfig } from '../config/resolve-config';
import { createActocoreI18n } from '../i18n/create-i18n';
import type { ActionRegistry } from '../actions/types';
import { ActocoreContextProvider } from '../context/actocore-context';
import { ActocoreThemeRoot, ActocoreSystemThemeSync } from '../theme/theme-provider';

export interface ActocoreProviderProps extends ActocoreSdkConfig {
  children: ReactNode;
  /** SDK entry surface — `marketing` uses public `/v1/marketing/sdk/*` routes (no real API key). */
  entryMode?: 'sdk' | 'marketing';
  /** Host-registered action handlers keyed by action name */
  actions?: ActionRegistry;
  /**
   * Live host-app context sent with each chat message.
   * Pass `{ route: location.pathname }` on navigation — page slug is resolved from App Layout.
   */
  hostContext?: HostContext;
  /**
   * When true, fetches GET /v1/sdk/runtime and merges `sdk` config under local props.
   * Local `i18n`, `theme`, `security`, `ui`, and `voice` override dashboard values.
   */
  loadRemoteConfig?: boolean;
}

export function ActocoreProvider({
  children,
  actions = {},
  loadRemoteConfig = false,
  hostContext,
  entryMode = 'sdk',
  ...sdkConfig
}: ActocoreProviderProps) {
  const [remoteSdk, setRemoteSdk] = useState<SdkRuntimeConfigData | null>(null);
  const [appPages, setAppPages] = useState<AppPageManifestEntry[]>([]);
  const [presentationReady, setPresentationReady] = useState(
    () => !loadRemoteConfig,
  );
  const [liveHostContext, setLiveHostContext] = useState<HostContext | undefined>(
    hostContext ?? sdkConfig.security?.hostContext,
  );

  useEffect(() => {
    if (!loadRemoteConfig) {
      setPresentationReady(true);
    } else {
      setPresentationReady(false);
    }

    let cancelled = false;

    async function loadRuntime() {
      try {
        const res = await runtimeApi.getConfig();
        if (cancelled || !res.success || !res.data) {
          return;
        }

        setAppPages(res.data.pages ?? []);
        if (loadRemoteConfig) {
          setRemoteSdk(res.data.sdk ?? null);
        }
      } finally {
        if (!cancelled && loadRemoteConfig) {
          setPresentationReady(true);
        }
      }
    }

    void loadRuntime();

    return () => {
      cancelled = true;
    };
  }, [loadRemoteConfig, entryMode, sdkConfig.apiKey, sdkConfig.baseURL]);

  useEffect(() => {
    const raw = hostContext ?? sdkConfig.security?.hostContext;
    setLiveHostContext(enrichHostContext(raw, appPages));
  }, [appPages, hostContext, sdkConfig.security?.hostContext]);

  const updateHostContext = useCallback(
    (context: HostContext | undefined) => {
      setLiveHostContext(enrichHostContext(context, appPages));
    },
    [appPages],
  );

  const mergedConfig = useMemo(
    () => mergeRemoteSdkConfig(sdkConfig, remoteSdk),
    [sdkConfig, remoteSdk],
  );

  const resolved = useMemo(() => resolveConfig(mergedConfig), [mergedConfig]);

  useMemo(() => {
    const isMarketing = entryMode === 'marketing';
    configureApi({
      apiKey: isMarketing ? 'public' : resolved.api.apiKey,
      baseURL: resolved.api.baseURL,
      apiVersion: resolved.api.apiVersion,
      sdkRoutePrefix: isMarketing ? 'marketing/sdk' : 'sdk',
    });
    return null;
  }, [
    entryMode,
    resolved.api.apiKey,
    resolved.api.baseURL,
    resolved.api.apiVersion,
  ]);

  const i18n = useMemo(
    () =>
      createActocoreI18n({
        locale: resolved.i18n.locale,
        translations: resolved.i18n.translations,
      }),
    [resolved.i18n.locale, resolved.i18n.translations],
  );

  useEffect(() => {
    void i18n.changeLanguage(resolved.i18n.locale);
  }, [i18n, resolved.i18n.locale]);

  return (
    <I18nextProvider i18n={i18n}>
      <ActocoreContextProvider
        config={resolved}
        actions={actions}
        appPages={appPages}
        hostContext={liveHostContext}
        setHostContext={updateHostContext}
        presentationReady={presentationReady}
      >
        <ActocoreThemeRoot>
          <ActocoreSystemThemeSync />
          {children}
        </ActocoreThemeRoot>
      </ActocoreContextProvider>
    </I18nextProvider>
  );
}
