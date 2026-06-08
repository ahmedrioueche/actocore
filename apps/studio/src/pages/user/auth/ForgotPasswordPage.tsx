import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLayout } from '@/components/auth/AuthLayout';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { useForgotPassword } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const forgot = useForgotPassword();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await forgot.mutateAsync(email.trim());
      setSubmitted(true);
    } catch (err) {
      const code = (err as Error & { errorCode?: string }).errorCode;
      setFormError(
        getApiErrorMessage(t, {
          errorCode: code,
          message: err instanceof Error ? err.message : undefined,
        }),
      );
    }
  };

  if (submitted) {
    return (
      <AuthLayout>
        <AuthCard
          title={t('auth.forgot.successTitle')}
          subtitle={t('auth.forgot.successSubtitle')}
          footer={
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              {t('auth.forgot.backToLogin')}
            </Link>
          }
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard
        title={t('auth.forgot.title')}
        subtitle={t('auth.forgot.subtitle')}
        footer={
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            {t('auth.forgot.backToLogin')}
          </Link>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            id="forgot-email"
            type="email"
            label={t('auth.forgot.email')}
            placeholder={t('auth.forgot.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {formError && (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          )}
          <Button type="submit" fullWidth loading={forgot.isPending}>
            {t('auth.forgot.submit')}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
