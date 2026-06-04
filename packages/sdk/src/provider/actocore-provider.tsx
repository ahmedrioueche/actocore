import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { configureApi, runtimeApi } from '@ahmedrioueche/actocore-shared';
import type { SdkRuntimeConfigData } from '@ahmedrioueche/actocore-shared';
import type { ActocoreSdkConfig } from '../config/types';
import { mergeRemoteSdkConfig } from '../config/merge-remote-sdk-config';
import { resolveConfig } from '../config/resolve-config';
import { createActocoreI18n } from '../i18n/create-i18n';
import type { ActionRegistry } from '../actions/types';
import { ActocoreContextProvider } from '../context/actocore-context';
import { ActocoreThemeRoot, ActocoreSystemThemeSync } from '../theme/theme-provider';

export interface ActocoreProviderProps extends ActocoreSdkConfig {
  children: ReactNode;
  /** Host-registered action handlers keyed by action name */
  actions?: ActionRegistry;
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
  ...sdkConfig
}: ActocoreProviderProps) {
  const [remoteSdk, setRemoteSdk] = useState<SdkRuntimeConfigData | null>(null);

  useEffect(() => {
    if (!loadRemoteConfig) {
      setRemoteSdk(null);
      return;
    }

    let cancelled = false;

    async function load() {
      const res = await runtimeApi.getConfig();
      if (!cancelled && res.success) {
        setRemoteSdk(res.data?.sdk ?? null);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadRemoteConfig, sdkConfig.apiKey, sdkConfig.baseURL]);

  const mergedConfig = useMemo(
    () => mergeRemoteSdkConfig(sdkConfig, remoteSdk),
    [sdkConfig, remoteSdk],
  );

  const resolved = useMemo(() => resolveConfig(mergedConfig), [mergedConfig]);

  useMemo(() => {
    configureApi({
      apiKey: resolved.api.apiKey,
      baseURL: resolved.api.baseURL,
      apiVersion: resolved.api.apiVersion,
    });
    return null;
  }, [resolved.api.apiKey, resolved.api.baseURL, resolved.api.apiVersion]);

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
      <ActocoreContextProvider config={resolved} actions={actions}>
        <ActocoreThemeRoot>
          <ActocoreSystemThemeSync />
          {children}
        </ActocoreThemeRoot>
      </ActocoreContextProvider>
    </I18nextProvider>
  );
}
