import { TokenManager } from '@ahmedrioueche/actocore-shared';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import { useEffect } from 'react';

import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { useWindowPathname } from '@/hooks/use-window-pathname';
import {
  forceLogout,
  shouldRedirectToLogin,
} from '@/lib/auth-session';
import { isAdminPath, isAdminPublicPath } from '@/lib/platform-session';
import { getCachedSession } from '@/routes/guards';
import { usePlatformMe } from '@/hooks/use-platform-auth';
import { queryClient } from '@/lib/query-client';
import Modals from '@/modals/Modals';
import Toaster from '@/components/ui/Toaster';
import LoadingPage from '@/pages/system/LoadingPage';
import { prefetchOnboardingState } from '@/routes/guards';
import { router } from '@/routes/router';

function AdminRouter() {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '';
  const isPublicAdmin = isAdminPublicPath(pathname);
  const hasToken = Boolean(TokenManager.getAccessToken());
  const meQuery = usePlatformMe(hasToken && !isPublicAdmin);

  useEffect(() => {
    if (isPublicAdmin && hasToken) {
      TokenManager.clearTokens();
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: ['platform'] });
    }
  }, [isPublicAdmin, hasToken]);

  if (
    hasToken &&
    !isPublicAdmin &&
    (meQuery.isLoading || (!meQuery.data && !meQuery.isError))
  ) {
    return <LoadingPage type="outer" />;
  }

  return <RouterProvider router={router} />;
}

function StudioRouter() {
  const pathname = useWindowPathname();
  const isAdmin = isAdminPath(pathname);
  const { isLoading, isAuthenticated, session, isError } = useAuth();
  const resolvedSession = session ?? getCachedSession();
  const hasToken = Boolean(TokenManager.getAccessToken());

  useEffect(() => {
    if (isAdmin || !isAuthenticated) {
      return;
    }
    void prefetchOnboardingState();
  }, [isAdmin, isAuthenticated]);

  useEffect(() => {
    if (isAdmin || isLoading) {
      return;
    }
    if (hasToken && isError && !resolvedSession) {
      void forceLogout();
      return;
    }
    if (shouldRedirectToLogin()) {
      void forceLogout();
    }
  }, [isAdmin, hasToken, isLoading, isAuthenticated, isError, resolvedSession]);

  if (isAdmin) {
    return <AdminRouter />;
  }

  if (hasToken && !resolvedSession) {
    return <LoadingPage type="outer" />;
  }

  if (shouldRedirectToLogin()) {
    return <LoadingPage type="outer" />;
  }

  return <RouterProvider router={router} />;
}

export function AppProviders() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ErrorBoundary>
              <StudioRouter />
              <Modals />
              <Toaster />
            </ErrorBoundary>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
