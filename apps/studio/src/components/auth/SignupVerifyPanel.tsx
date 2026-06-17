import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { AuthFormHeader } from '@/components/auth/AuthFormHeader';
import { AuthGlassCard } from '@/components/auth/AuthGlassCard';
import Button from '@/components/ui/Button';

interface SignupVerifyPanelProps {
  maskedEmail: string;
  devVerificationUrl?: string | null;
  resendPending: boolean;
  onResend: () => void;
}

export function SignupVerifyPanel({
  maskedEmail,
  devVerificationUrl,
  resendPending,
  onResend,
}: SignupVerifyPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      <AuthFormHeader
        align="start"
        className="mb-8"
        title={t('auth.signup.verifyTitle')}
        subtitle={t('auth.signup.verifySubtitle', { email: maskedEmail })}
      />
      <AuthGlassCard>
        {devVerificationUrl ? (
          <div
            className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-text-primary"
            role="status"
          >
            <p className="mb-2 font-semibold">{t('auth.signup.devVerifyTitle')}</p>
            <p className="mb-3 text-text-secondary">
              {t('auth.signup.devVerifyHint')}
            </p>
            <a
              href={devVerificationUrl}
              className="break-all font-medium text-primary underline-offset-2 hover:underline"
            >
              {t('auth.signup.devVerifyLink')}
            </a>
          </div>
        ) : null}
        <p className="mb-6 text-sm text-text-secondary">
          {t('auth.signup.verifyInstructions')}
        </p>
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            loading={resendPending}
            onClick={onResend}
          >
            {t('auth.signup.resend')}
          </Button>
          <Link
            to="/login"
            className="auth-primary-button flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold no-underline"
          >
            {t('auth.signup.goToLogin')}
          </Link>
        </div>
      </AuthGlassCard>
    </>
  );
}
