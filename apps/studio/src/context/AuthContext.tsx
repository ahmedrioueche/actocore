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
import { clearAuthSession } from '@/lib/auth-session';

interface AuthContextValue {
  session: StudioAuthMeData | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasToken = Boolean(TokenManager.getAccessToken());
  const meQuery = useAuthMe(hasToken);

  useEffect(() => {
    if (!hasToken || !meQuery.isError) {
      return;
    }
    if (!TokenManager.getRefreshToken()) {
      void clearAuthSession();
    }
  }, [hasToken, meQuery.isError]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session: meQuery.data,
      isAuthenticated: Boolean(meQuery.data && hasToken),
      isLoading: hasToken && meQuery.isLoading,
      isError: meQuery.isError,
      refetch: () => {
        void meQuery.refetch();
      },
    }),
    [
      meQuery.data,
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
