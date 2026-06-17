import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLayout } from '@/components/auth/AuthLayout';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import Loading from '@/components/ui/Loading';
import { useVerifyEmail } from '@/hooks/use-auth';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

type VerifySearch = {
  token?: string;
};

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as VerifySearch;
  const verify = useVerifyEmail();

  const [token, setToken] = useState(search.token ?? '');
  const [autoDone, setAutoDone] = useState(false);

  const runVerify = async (value: string) => {
    try {
      await verify.mutateAsync(value.trim());
      setAutoDone(true);
      setTimeout(() => {
        void navigate({ to: '/' });
      }, 1500);
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

  useEffect(() => {
    if (search.token && !autoDone && !verify.isPending) {
      void runVerify(search.token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-verify once from URL
  }, [search.token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error(t('auth.verify.missingToken'));
      return;
    }
    void runVerify(token);
  };

  if (verify.isPending && search.token) {
    return (
      <AuthLayout>
        <AuthCard
          title={t('auth.verify.title')}
          subtitle={t('auth.verify.subtitle')}
        >
          <Loading fullScreen={false} className="py-8" />
        </AuthCard>
      </AuthLayout>
    );
  }

  if (autoDone) {
    return (
      <AuthLayout>
        <AuthCard
          title={t('auth.verify.title')}
          subtitle={t('auth.verify.success')}
        >
          <Loading fullScreen={false} className="py-8" />
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard
        title={t('auth.verify.title')}
        subtitle={
          search.token ? t('auth.verify.subtitle') : t('auth.verify.missingToken')
        }
        footer={
          <Link to="/login" className="text-primary font-semibold hover:underline">
            {t('auth.signup.goToLogin')}
          </Link>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            id="verify-token"
            label={t('auth.verify.tokenLabel')}
            placeholder={t('auth.verify.tokenPlaceholder')}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Button type="submit" fullWidth loading={verify.isPending}>
            {t('auth.verify.submit')}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
