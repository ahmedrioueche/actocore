export const APP_LAYOUT_HOST_CONTEXT_HOOK = `import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useActocoreHostContext } from '@ahmedrioueche/actocore-sdk';

/** Call once inside ActocoreProvider — updates context on every navigation. */
export function ActocoreRouteContext() {
  const { pathname } = useLocation();
  const { setHostContext } = useActocoreHostContext();

  useEffect(() => {
    setHostContext({ route: pathname });
  }, [pathname, setHostContext]);

  return null;
}`;

export const APP_LAYOUT_HOST_CONTEXT_ONE_LINER = `setHostContext({ route: location.pathname });`;
