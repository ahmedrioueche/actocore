import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { ResolvedActocoreConfig } from '../config/types';
import type { ActionRegistry } from '../actions/types';

export interface ActocoreContextValue {
  config: ResolvedActocoreConfig;
  actions: ActionRegistry;
}

const ActocoreContext = createContext<ActocoreContextValue | null>(null);

export function ActocoreContextProvider({
  config,
  actions,
  children,
}: {
  config: ResolvedActocoreConfig;
  actions: ActionRegistry;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ config, actions }),
    [config, actions],
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

export function useActionRegistry(): ActionRegistry {
  return useActocoreContext().actions;
}
