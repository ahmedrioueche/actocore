import { useEffect, useMemo, useState } from 'react';
import { configureApi } from '@ahmedrioueche/actocore-shared';
import type { ActionData } from '@ahmedrioueche/actocore-shared';
import { sdkActionsApi } from '@ahmedrioueche/actocore-shared';
import { buildFallbackActions } from '../actions/demo-action-catalog';
import {
  useActionRegistry,
  useActocoreConfig,
  useActocoreSecurity,
} from '../context/actocore-context';
import { isActionAllowed } from '../security/action-allowlist';
import { useApiErrorMessage } from './use-api-error';

export interface UseActocoreActionsResult {
  actions: ActionData[];
  isLoading: boolean;
  error: string | null;
  usingFallback: boolean;
}

export function useActocoreActions(): UseActocoreActionsResult {
  const { api } = useActocoreConfig();
  const security = useActocoreSecurity();
  const handlers = useActionRegistry();
  const formatError = useApiErrorMessage();
  const [actions, setActions] = useState<ActionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const handlerNames = useMemo(
    () =>
      Object.keys(handlers).filter((name) =>
        isActionAllowed(name, security),
      ),
    [handlers, security],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!api.apiKey?.trim()) {
        setActions(buildFallbackActions(handlerNames));
        setUsingFallback(true);
        setError(null);
        setIsLoading(false);
        return;
      }

      configureApi({
        apiKey: api.apiKey,
        baseURL: api.baseURL,
        apiVersion: api.apiVersion,
      });

      setIsLoading(true);
      setError(null);
      setUsingFallback(false);

      try {
        const res = await sdkActionsApi.list();
        if (!res.success) {
          if (!cancelled) {
            setError(formatError(res));
            setActions(buildFallbackActions(handlerNames));
            setUsingFallback(true);
          }
          return;
        }

        const fromApi = (res.data ?? []).filter((a) => a.enabled);
        if (!cancelled) {
          if (fromApi.length > 0) {
            setActions(fromApi);
          } else {
            setActions(buildFallbackActions(handlerNames));
            setUsingFallback(true);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(formatError(e));
          setActions(buildFallbackActions(handlerNames));
          setUsingFallback(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    api.apiKey,
    api.apiVersion,
    api.baseURL,
    formatError,
    handlerNames,
  ]);

  const available = useMemo(
    () =>
      actions.filter(
        (action) =>
          action.enabled &&
          isActionAllowed(action.name, security) &&
          handlerNames.includes(action.name),
      ),
    [actions, handlerNames, security],
  );

  return { actions: available, isLoading, error, usingFallback };
}
