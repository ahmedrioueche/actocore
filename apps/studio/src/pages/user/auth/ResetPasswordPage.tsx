import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLayout } from '@/components/auth/AuthLayout';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { useResetPassword } from '@/hooks/use-auth';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

type ResetSearch = {
  token?: string;
};

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as ResetSearch;
  const reset = useResetPassword();

  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);

  const token = search.token?.trim() ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(t('auth.reset.missingToken'));
      return;
    }
    try {
      await reset.mutateAsync({ token, password });
      setDone(true);
      setTimeout(() => {
        void navigate({ to: '/login' });
      }, 2000);
    } catch (err) {
      const code = (err as Error & { errorCode?: string }).errorCode;
      toast.error(
        getApiErrorMessage(t, {
          errorCode: code,
          message: err instanceof Error ? err.message : undefined,
        }),
      );
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <AuthCard
          title={t('auth.reset.title')}
          subtitle={t('auth.reset.success')}
          footer={
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              {t('auth.signup.goToLogin')}
            </Link>
          }
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard
        title={t('auth.reset.title')}
        subtitle={
          token ? t('auth.reset.subtitle') : t('auth.reset.missingToken')
        }
        footer={
          <Link
            to="/forgot-password"
            className="text-primary font-semibold hover:underline"
          >
            {t('auth.forgot.title')}
          </Link>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            id="reset-password"
            type="password"
            label={t('auth.reset.password')}
            placeholder={t('auth.reset.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={!token}
          />
          <Button
            type="submit"
            fullWidth
            loading={reset.isPending}
            disabled={!token}
          >
            {t('auth.reset.submit')}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
