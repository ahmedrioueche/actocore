import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { studioAuthApi } from '@ahmedrioueche/actocore-shared';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLayout } from '@/components/auth/AuthLayout';
import Loading from '@/components/ui/Loading';
import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';

const exchangePromises = new Map<string, Promise<void>>();

function readCallbackCode(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code')?.trim();
  return code || undefined;
}

function readCallbackError(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error')?.trim();
  return error || undefined;
}

async function exchangeGoogleOAuthCode(code: string): Promise<void> {
  const existing = exchangePromises.get(code);
  if (existing) {
    await existing;
    return;
  }

  const promise = (async () => {
    ensureApiConfigured();
    const res = await studioAuthApi.completeGoogleAuth({ code });
    parseApiResponse(res);
  })();

  exchangePromises.set(code, promise);

  try {
    await promise;
  } finally {
    exchangePromises.delete(code);
  }
}

export default function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const error = readCallbackError();
      const code = readCallbackCode();

      if (error || !code) {
        if (!cancelled) {
          setFailed(true);
        }
        return;
      }

      try {
        await exchangeGoogleOAuthCode(code);
        if (!cancelled) {
          void navigate({ to: '/projects', replace: true });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[auth/callback] Google sign-in exchange failed', err);
        }
        if (!cancelled) {
          setFailed(true);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
