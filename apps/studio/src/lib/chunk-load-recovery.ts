const CHUNK_RELOAD_SESSION_KEY = 'studio.chunk-reload';

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('loading chunk') ||
    message.includes('importing a module script failed') ||
    message.includes('error loading dynamically imported module')
  );
}

/** Reload once after a deploy when cached HTML points at missing JS chunks. */
export function reloadOnceForStaleChunk(error: unknown): boolean {
  if (!isChunkLoadError(error) || typeof window === 'undefined') {
    return false;
  }

  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
    sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY);
    return false;
  }

  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, '1');
  window.location.reload();
  return true;
}

export function setupChunkLoadRecovery(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnceForStaleChunk(
      new Error('Failed to fetch dynamically imported module'),
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (reloadOnceForStaleChunk(event.reason)) {
      event.preventDefault();
    }
  });
}
