import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';

import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { queryClient } from '@/lib/query-client';
import Modals from '@/modals/Modals';
import LoadingPage from '@/pages/system/LoadingPage';
import { router } from '@/routes/router';

function StudioRouter() {
  const { isLoading } = useAuth();

  if (isLoading) {
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
            </ErrorBoundary>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
