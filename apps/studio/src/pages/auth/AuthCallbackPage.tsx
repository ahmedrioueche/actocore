import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLayout } from '@/components/auth/AuthLayout';
import Loading from '@/components/ui/Loading';
import { useStoreOAuthTokens } from '@/hooks/use-auth';

type CallbackSearch = {
  success?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

export default function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as CallbackSearch;
  const storeTokens = useStoreOAuthTokens();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ok = search.success === 'true';
    const accessToken = search.accessToken;
    const refreshToken = search.refreshToken;

    if (!ok || !accessToken || !refreshToken || search.error) {
      setFailed(true);
      return;
    }

    storeTokens.mutate(
      { accessToken, refreshToken },
      {
        onSuccess: () => {
          void navigate({ to: '/projects' });
        },
        onError: () => setFailed(true),
      },
    );
    // Run once for OAuth redirect query params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout>
      <AuthCard
        title={t('auth.callback.title')}
        subtitle={
          failed ? t('auth.callback.error') : t('auth.callback.subtitle')
        }
      >
        {failed ? (
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline text-sm"
          >
            {t('auth.signup.goToLogin')}
          </Link>
        ) : (
          <Loading fullScreen={false} className="py-8" />
        )}
      </AuthCard>
    </AuthLayout>
  );
}
