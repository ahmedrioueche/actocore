import { useEffect, useMemo, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { configureApi } from '@ahmedrioueche/actocore-shared';
import type { ActocoreSdkConfig } from '../config/types';
import { resolveConfig } from '../config/resolve-config';
import { createActocoreI18n } from '../i18n/create-i18n';
import type { ActionRegistry } from '../actions/types';
import { ActocoreContextProvider } from '../context/actocore-context';
import { ActocoreThemeRoot, ActocoreSystemThemeSync } from '../theme/theme-provider';

export interface ActocoreProviderProps extends ActocoreSdkConfig {
  children: ReactNode;
  /** Host-registered action handlers keyed by action name */
  actions?: ActionRegistry;
}

export function ActocoreProvider({
  children,
  actions = {},
  ...sdkConfig
}: ActocoreProviderProps) {
  const resolved = useMemo(() => resolveConfig(sdkConfig), [sdkConfig]);

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
