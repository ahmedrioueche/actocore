import { SDK_LATEST_VERSION } from '@ahmedrioueche/actocore-shared';
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'actocore-studio:dismissed-sdk-release';

function getDismissedVersion(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(STORAGE_KEY);
}

export function useSdkReleaseBanner() {
  const [dismissedVersion, setDismissedVersion] = useState(getDismissedVersion);

  const isVisible = dismissedVersion !== SDK_LATEST_VERSION;

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, SDK_LATEST_VERSION);
    setDismissedVersion(SDK_LATEST_VERSION);
  }, []);

  return {
    isVisible,
    dismiss,
    latestVersion: SDK_LATEST_VERSION,
  };
}
