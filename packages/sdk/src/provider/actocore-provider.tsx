import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import {
  configureApi,
  enrichHostContext,
  runtimeApi,
} from '@ahmedrioueche/actocore-shared';
import type {
  AppPageManifestEntry,
  HostContext,
  RuntimeConfigData,
  SdkRuntimeConfigData,
} from '@ahmedrioueche/actocore-shared';
import type { ActocoreSdkConfig } from '../config/types';
import { mergeRemoteSdkConfig } from '../config/merge-remote-sdk-config';
import { resolveConfig } from '../config/resolve-config';
import { createActocoreI18n } from '../i18n/create-i18n';
import type { ActionRegistry } from '../actions/types';
import { ActocoreContextProvider } from '../context/actocore-context';
import { ActocoreThemeRoot, ActocoreSystemThemeSync } from '../theme/theme-provider';

const DEFAULT_REMOTE_CONFIG_POLL_MS = 5000;

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
  /** When set, used instead of pages returned by GET /runtime. */
  appPages?: AppPageManifestEntry[];
  /**
   * Increment to refetch dashboard SDK config after PATCH without remounting
   * the provider (preserves chat session state).
   */
  remoteConfigVersion?: number;
  /**
   * Poll interval (ms) for project data changes when `loadRemoteConfig` is true.
   * Set to `0` to disable polling (manual refresh via `remoteConfigVersion` only).
   * Default `5000`.
   */
  remoteConfigPollIntervalMs?: number;
}

function applyRuntimePayload(
  data: RuntimeConfigData,
  loadRemoteConfig: boolean,
): {
  pages: AppPageManifestEntry[];
  sdk: SdkRuntimeConfigData | null;
} {
  return {
    pages: data.pages ?? [],
    sdk: loadRemoteConfig ? (data.sdk ?? null) : null,
  };
}

export function ActocoreProvider({
  children,
  actions = {},
  loadRemoteConfig = false,
  hostContext,
  entryMode = 'sdk',
  appPages: appPagesProp,
  remoteConfigVersion = 0,
  remoteConfigPollIntervalMs = DEFAULT_REMOTE_CONFIG_POLL_MS,
  ...sdkConfig
}: ActocoreProviderProps) {
  const [remoteSdk, setRemoteSdk] = useState<SdkRuntimeConfigData | null>(null);
  const [fetchedAppPages, setFetchedAppPages] = useState<AppPageManifestEntry[]>([]);
  const [presentationReady, setPresentationReady] = useState(
    () => !loadRemoteConfig,
  );
  const [internalDataVersion, setInternalDataVersion] = useState(0);
  const hasLoadedRemoteRef = useRef(false);
  const lastDataRevisionRef = useRef<string | undefined>(undefined);
  const [liveHostContext, setLiveHostContext] = useState<HostContext | undefined>(
    hostContext ?? sdkConfig.security?.hostContext,
  );

  const projectDataVersion = remoteConfigVersion + internalDataVersion;

  const applyRuntimeData = useCallback(
    (data: RuntimeConfigData) => {
      const { pages, sdk } = applyRuntimePayload(data, loadRemoteConfig);
      setFetchedAppPages(pages);
      if (loadRemoteConfig) {
        setRemoteSdk(sdk);
        hasLoadedRemoteRef.current = true;
      }

      const revision = data.dataRevision;
      if (revision !== undefined) {
        if (revision !== lastDataRevisionRef.current) {
          lastDataRevisionRef.current = revision;
          setInternalDataVersion((value) => value + 1);
        }
      } else {
        setInternalDataVersion((value) => value + 1);
      }
    },
    [loadRemoteConfig],
  );

  useEffect(() => {
    if (!loadRemoteConfig) {
      setPresentationReady(true);
      return;
    }

    const isInitialLoad = !hasLoadedRemoteRef.current;
    if (isInitialLoad) {
      setPresentationReady(false);
    }

    let cancelled = false;

    async function loadRuntime() {
      try {
        const res = await runtimeApi.getConfig();
        if (cancelled || !res.success || !res.data) {
          return;
        }

        applyRuntimeData(res.data);
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
  }, [
    applyRuntimeData,
    loadRemoteConfig,
    entryMode,
    sdkConfig.apiKey,
    sdkConfig.baseURL,
    remoteConfigVersion,
  ]);

  useEffect(() => {
    if (!loadRemoteConfig || remoteConfigPollIntervalMs <= 0) {
      return;
    }

    let cancelled = false;

    async function pollRuntime() {
      try {
        const res = await runtimeApi.getConfig();
        if (cancelled || !res.success || !res.data) {
          return;
        }
        applyRuntimeData(res.data);
      } catch {
        // Ignore transient poll errors — next interval retries.
      }
    }

    const id = window.setInterval(() => {
      void pollRuntime();
    }, remoteConfigPollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    applyRuntimeData,
    loadRemoteConfig,
    remoteConfigPollIntervalMs,
    sdkConfig.apiKey,
    sdkConfig.baseURL,
    entryMode,
  ]);

  const appPages = appPagesProp ?? fetchedAppPages;

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

  const i18nTranslationsKey = useMemo(
    () => JSON.stringify(resolved.i18n.translations ?? {}),
    [resolved.i18n.translations],
  );

  const i18n = useMemo(
    () =>
      createActocoreI18n({
        locale: resolved.i18n.locale,
        translations: resolved.i18n.translations,
      }),
    [resolved.i18n.locale, i18nTranslationsKey, resolved.i18n.translations],
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
        projectDataVersion={projectDataVersion}
      >
        <ActocoreThemeRoot>
          <ActocoreSystemThemeSync />
          {children}
        </ActocoreThemeRoot>
      </ActocoreContextProvider>
    </I18nextProvider>
  );
}
