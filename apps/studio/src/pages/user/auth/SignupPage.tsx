import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthFormHeader } from '@/components/auth/AuthFormHeader';
import { AuthGlassCard } from '@/components/auth/AuthGlassCard';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthLegalNotice } from '@/components/auth/AuthLegalNotice';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { SignupCredentialsForm } from '@/components/auth/SignupCredentialsForm';
import { SignupVerifyPanel } from '@/components/auth/SignupVerifyPanel';
import { useResendVerification, useSignup } from '@/hooks/use-auth';
import { maskEmail } from '@/utils/mask-email';
import { getApiErrorMessage, getMessage } from '@/utils/statusMessage';
import {
  parseSignupPlanSearch,
  saveSignupPlanIntent,
} from '@/lib/signup-plan-intent';

export default function SignupPage() {
  const { t } = useTranslation();
  const search = useSearch({ from: '/signup' });
  const signup = useSignup();
  const resend = useResendVerification();

  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(
    null,
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    const intent = parseSignupPlanSearch(search);
    if (intent) {
      saveSignupPlanIntent(intent);
    }
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const name = fullName.trim();
    if (!name) {
      setFormError(t('auth.signup.fullNameRequired'));
      return;
    }
    try {
      const result = await signup.mutateAsync({
        accountName: name,
        email: email.trim(),
        password,
        displayName: name,
      });
      setSuccessEmail(result.email);
      setDevVerificationUrl(result.devVerificationUrl ?? null);
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
      const result = await resend.mutateAsync(successEmail);
      setResendMessage(t('auth.signup.resendSuccess'));
      if (result.devVerificationUrl) {
        setDevVerificationUrl(result.devVerificationUrl);
      }
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
      <AuthLayout brandVariant="signup">
        <SignupVerifyPanel
          maskedEmail={maskEmail(successEmail)}
          devVerificationUrl={devVerificationUrl}
          resendMessage={resendMessage}
          resendPending={resend.isPending}
          onResend={handleResend}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout brandVariant="signup">
      <AuthFormHeader
        title={t('auth.signup.title')}
        subtitle={t('auth.signup.subtitle')}
      />

      <AuthGlassCard>
        <GoogleAuthButton labelKey="auth.signup.google" />
        <AuthDivider labelKey="auth.signup.dividerEmail" />
        <SignupCredentialsForm
          fullName={fullName}
          email={email}
          password={password}
          formError={formError}
          loading={signup.isPending}
          onFullNameChange={setFullName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
        <AuthLegalNotice />
      </AuthGlassCard>

      <footer className="mt-5 text-center">
        <p className="text-sm text-text-secondary">
          {t('auth.signup.hasAccount')}{' '}
          <Link
            to="/login"
            className="font-semibold text-primary transition-colors hover:underline"
          >
            {t('auth.signup.loginLink')}
          </Link>
        </p>
      </footer>
    </AuthLayout>
  );
}
