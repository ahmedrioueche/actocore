import { useTranslation } from 'react-i18next';

import { authInputClass } from '@/components/auth/auth-styles';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import InputField from '@/components/ui/InputField';

export interface SignupCredentialsFormProps {
  fullName: string;
  email: string;
  password: string;
  loading: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SignupCredentialsForm({
  fullName,
  email,
  password,
  loading,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: SignupCredentialsFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <InputField
        id="full-name"
        type="text"
        label={t('auth.signup.fullName')}
        placeholder={t('auth.signup.fullNamePlaceholder')}
        value={fullName}
        onChange={(e) => onFullNameChange(e.target.value)}
        autoComplete="name"
        required
        minLength={2}
        className={authInputClass}
      />
      <InputField
        id="signup-email"
        type="email"
        label={t('auth.signup.email')}
        placeholder={t('auth.signup.emailPlaceholder')}
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        autoComplete="email"
        required
        className={authInputClass}
      />
      <InputField
        id="signup-password"
        type="password"
        label={t('auth.signup.password')}
        placeholder={t('auth.signup.passwordPlaceholder')}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
        className={authInputClass}
      />
      <p className="text-xs text-text-secondary">{t('auth.signup.passwordHint')}</p>

      <AuthPrimaryButton loading={loading} disabled={loading}>
        {loading ? t('auth.signup.submitting') : t('auth.signup.submit')}
      </AuthPrimaryButton>
    </form>
  );
}
