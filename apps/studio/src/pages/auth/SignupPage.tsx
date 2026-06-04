import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { useResendVerification, useSignup } from '@/hooks/use-auth';
import { maskEmail } from '@/utils/mask-email';
import { getApiErrorMessage, getMessage } from '@/utils/statusMessage';

export default function SignupPage() {
  const { t } = useTranslation();
  const signup = useSignup();
  const resend = useResendVerification();

  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const result = await signup.mutateAsync({
        accountName: accountName.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
      });
      setSuccessEmail(result.email);
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

  const handleResend = async () => {
    if (!successEmail) return;
    setResendMessage(null);
    try {
      await resend.mutateAsync(successEmail);
      setResendMessage(t('auth.signup.resendSuccess'));
    } catch (err) {
      const code = (err as Error & { errorCode?: string }).errorCode;
      setResendMessage(
        getMessage(
          t,
          code,
          err instanceof Error ? err.message : undefined,
        ),
      );
    }
  };

  if (successEmail) {
    return (
      <AuthLayout>
        <AuthCard
          title={t('auth.signup.verifyTitle')}
          subtitle={t('auth.signup.verifySubtitle', {
            email: maskEmail(successEmail),
          })}
        >
          <p className="text-sm text-text-secondary mb-6">
            {t('auth.signup.verifyInstructions')}
          </p>
          {resendMessage && (
            <p className="text-sm text-success mb-4" role="status">
              {resendMessage}
            </p>
          )}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              loading={resend.isPending}
              onClick={handleResend}
            >
              {t('auth.signup.resend')}
            </Button>
            <Link
              to="/login"
              className="block w-full text-center py-3 rounded-xl font-semibold bg-primary text-primary-contrast hover:brightness-110"
            >
              {t('auth.signup.goToLogin')}
            </Link>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard
        title={t('auth.signup.title')}
        subtitle={t('auth.signup.subtitle')}
        footer={
          <p>
            {t('auth.signup.hasAccount')}{' '}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              {t('auth.signup.loginLink')}
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            id="accountName"
            label={t('auth.signup.accountName')}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
            minLength={2}
          />
          <InputField
            id="signup-email"
            type="email"
            label={t('auth.signup.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <InputField
            id="signup-password"
            type="password"
            label={t('auth.signup.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <p className="text-xs text-text-secondary -mt-2">
            {t('auth.signup.passwordHint')}
          </p>
          <InputField
            id="displayName"
            label={t('auth.signup.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          {formError && (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={signup.isPending}
            disabled={signup.isPending}
          >
            {t('auth.signup.submit')}
          </Button>
        </form>

        <AuthDivider />
        <GoogleAuthButton />
      </AuthCard>
    </AuthLayout>
  );
}
