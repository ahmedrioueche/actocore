import type { StudioAuthMeData } from '@ahmedrioueche/actocore-shared';
import { TokenManager } from '@ahmedrioueche/actocore-shared';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

import { useAuthMe } from '@/hooks/use-auth';
import { useWindowPathname } from '@/hooks/use-window-pathname';
import { clearAuthSession, isPublicAppPath } from '@/lib/auth-session';
import { isAdminPath } from '@/lib/platform-session';
import { getCachedSession } from '@/routes/guards';

interface AuthContextValue {
  session: StudioAuthMeData | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = useWindowPathname();
  const onAdminPath = isAdminPath(pathname);
  const hasToken = Boolean(TokenManager.getAccessToken());
  const meQuery = useAuthMe(hasToken && !onAdminPath);
  const cachedSession = getCachedSession();
  const session = meQuery.data ?? cachedSession;

  useEffect(() => {
    if (!hasToken || !meQuery.isError) {
      return;
    }
    if (!TokenManager.getRefreshToken() && !isPublicAppPath(pathname)) {
      void clearAuthSession();
    }
  }, [hasToken, meQuery.isError, pathname]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session && hasToken),
      isLoading:
        hasToken && meQuery.isLoading && !session && !meQuery.isError,
      isError: meQuery.isError && !session,
      refetch: () => {
        void meQuery.refetch();
      },
    }),
    [
      session,
      meQuery.isLoading,
      meQuery.isError,
      meQuery.refetch,
      hasToken,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
