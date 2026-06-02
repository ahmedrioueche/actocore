import { useEffect, useState } from 'react';
import { runtimeApi } from '@ahmedrioueche/actocore-shared';
import type { RuntimeConfigData } from '@ahmedrioueche/actocore-shared';
import { useApiErrorMessage } from './use-api-error';

export interface UseActocoreRuntimeResult {
  config: RuntimeConfigData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches Core runtime config (feature flags, etc.).
 * Currently optional for the UI — provided for future dashboard-driven toggles.
 */
export function useActocoreRuntime(): UseActocoreRuntimeResult {
  const [config, setConfig] = useState<RuntimeConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formatError = useApiErrorMessage();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await runtimeApi.getConfig();
        if (!res.success) {
          if (!cancelled) setError(formatError(res));
          return;
        }
        if (!cancelled) setConfig(res.data ?? null);
      } catch (e) {
        if (!cancelled) setError(formatError(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [formatError]);

  return { config, isLoading, error };
}

