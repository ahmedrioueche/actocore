import { useSyncExternalStore } from 'react';

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

function getMobileMediaQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  return window.matchMedia(MOBILE_MEDIA_QUERY);
}

function subscribeMobile(onStoreChange: () => void) {
  const mq = getMobileMediaQuery();
  if (!mq) return () => undefined;
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getMobileSnapshot() {
  return getMobileMediaQuery()?.matches ?? false;
}

function getMobileServerSnapshot() {
  return false;
}

/** Matches Studio `md` breakpoint — mobile = below 768px. */
export function useMobileViewport() {
  return useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );
}
