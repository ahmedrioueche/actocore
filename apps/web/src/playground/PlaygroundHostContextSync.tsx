import { useActocoreHostContext } from '@ahmedrioueche/actocore-sdk';
import { useEffect, useRef } from 'react';

type PlaygroundHostContextSyncProps = {
  currentPage: string;
  route: string;
};

/** Keeps live route/page context for the in-app assistant. */
export function PlaygroundHostContextSync({
  currentPage,
  route,
}: PlaygroundHostContextSyncProps) {
  const { hostContext, setHostContext } = useActocoreHostContext();
  const hostRef = useRef(hostContext);
  hostRef.current = hostContext;

  useEffect(() => {
    const base = hostRef.current;
    if (base?.currentPage === currentPage && base?.route === route) {
      return;
    }

    setHostContext({
      ...base,
      currentPage,
      route,
    });
  }, [currentPage, route, setHostContext]);

  return null;
}
