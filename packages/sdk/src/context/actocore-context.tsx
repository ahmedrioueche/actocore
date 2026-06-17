import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { HostContext } from '@ahmedrioueche/actocore-shared';
import type { AppPageManifestEntry } from '@ahmedrioueche/actocore-shared';
import type { ResolvedActocoreConfig } from '../config/types';
import type { ActionRegistry } from '../actions/types';

export interface ActocoreContextValue {
  config: ResolvedActocoreConfig;
  actions: ActionRegistry;
  appPages: AppPageManifestEntry[];
  hostContext?: HostContext;
  setHostContext: (context: HostContext | undefined) => void;
  /** False while dashboard config is loading when `loadRemoteConfig` is enabled. */
  presentationReady: boolean;
  /**
   * Bumps when remote project data changes (sdk config, pages, actions, knowledge).
   * Used to refresh action lists without remounting the provider.
   */
  projectDataVersion: number;
}

const ActocoreContext = createContext<ActocoreContextValue | null>(null);

export function ActocoreContextProvider({
  config,
  actions,
  appPages,
  hostContext,
  setHostContext,
  presentationReady = true,
  projectDataVersion = 0,
  children,
}: {
  config: ResolvedActocoreConfig;
  actions: ActionRegistry;
  appPages: AppPageManifestEntry[];
  hostContext?: HostContext;
  setHostContext: (context: HostContext | undefined) => void;
  presentationReady?: boolean;
  projectDataVersion?: number;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      config,
      actions,
      appPages,
      hostContext,
      setHostContext,
      presentationReady,
      projectDataVersion,
    }),
    [
      config,
      actions,
      appPages,
      hostContext,
      setHostContext,
      presentationReady,
      projectDataVersion,
    ],
  );

  return (
    <ActocoreContext.Provider value={value}>{children}</ActocoreContext.Provider>
  );
}

export function useActocoreContext(): ActocoreContextValue {
  const ctx = useContext(ActocoreContext);
  if (!ctx) {
    throw new Error('useActocoreContext must be used within ActocoreProvider');
  }
  return ctx;
}

export function useActocoreConfig(): ResolvedActocoreConfig {
  return useActocoreContext().config;
}

export function useActocoreUiConfig() {
  return useActocoreContext().config.ui;
}

export function useActocoreVoiceConfig() {
  return useActocoreContext().config.voice;
}

export function useActocoreSecurity() {
  return useActocoreContext().config.security;
}

export function useActocoreHostContext() {
  const { hostContext, setHostContext, appPages } = useActocoreContext();
  return { hostContext, setHostContext, appPages };
}

export function useActionRegistry(): ActionRegistry {
  return useActocoreContext().actions;
}
