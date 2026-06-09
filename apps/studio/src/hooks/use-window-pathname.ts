import { useEffect, useState } from 'react';

/** Tracks SPA pathname changes (TanStack Router uses history.pushState). */
export function useWindowPathname(): string {
  const [pathname, setPathname] = useState(
    () =>
      typeof window !== 'undefined' ? window.location.pathname : '/',
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const sync = () => setPathname(window.location.pathname);

    window.addEventListener('popstate', sync);

    const { pushState, replaceState } = history;
    history.pushState = function pushStatePatched(...args) {
      pushState.apply(this, args as Parameters<History['pushState']>);
      sync();
    };
    history.replaceState = function replaceStatePatched(...args) {
      replaceState.apply(this, args as Parameters<History['replaceState']>);
      sync();
    };

    return () => {
      window.removeEventListener('popstate', sync);
      history.pushState = pushState;
      history.replaceState = replaceState;
    };
  }, []);

  return pathname;
}
