const DEFAULT_CLARITY_PROJECT_ID = 'x9em7dny47';

let initialized = false;

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };

export function initClarity(): void {
  const explicitlyDisabled =
    import.meta.env.VITE_CLARITY_ENABLED?.trim().toLowerCase() === 'false';
  const projectId =
    import.meta.env.VITE_CLARITY_PROJECT_ID?.trim() ||
    DEFAULT_CLARITY_PROJECT_ID;

  if (explicitlyDisabled || initialized || !projectId) {
    return;
  }

  const w = window as typeof window & { clarity?: ClarityFn };

  w.clarity =
    w.clarity ||
    function (...args: unknown[]) {
      (w.clarity!.q = w.clarity!.q || []).push(args);
    };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;

  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  initialized = true;
}

export function isClarityEnabled(): boolean {
  return initialized;
}
