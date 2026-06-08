import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { authInputClass } from '@/components/auth/auth-styles';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import InputField from '@/components/ui/InputField';
import { cn } from '@/utils/helper';

export interface LoginCredentialsFormProps {
  teamMode: boolean;
  email: string;
  password: string;
  workspaceId: string;
  username: string;
  rememberMe: boolean;
  formError: string | null;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onWorkspaceIdChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onTeamModeToggle: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginCredentialsForm({
  teamMode,
  email,
  password,
  workspaceId,
  username,
  rememberMe,
  formError,
  loading,
  onEmailChange,
  onPasswordChange,
  onWorkspaceIdChange,
  onUsernameChange,
  onRememberMeChange,
  onTeamModeToggle,
  onSubmit,
}: LoginCredentialsFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!teamMode ? (
        <>
          <InputField
            id="email"
            type="email"
            label={t('auth.login.email')}
            placeholder={t('auth.login.emailPlaceholder')}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            autoComplete="email"
            required
            className={authInputClass}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-text-primary"
              >
                {t('auth.login.password')}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
            <InputField
              id="password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="current-password"
              placeholder={t('auth.login.passwordPlaceholder')}
              required
              className={authInputClass}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => onRememberMeChange(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label
              htmlFor="remember-me"
              className="text-sm text-text-secondary"
            >
              {t('auth.login.rememberMe')}
            </label>
          </div>
        </>
      ) : (
        <>
          <div>
            <InputField
              id="workspaceId"
              type="text"
              label={t('auth.login.workspaceId')}
              value={workspaceId}
              onChange={(e) => onWorkspaceIdChange(e.target.value)}
              placeholder={t('auth.login.workspaceIdPlaceholder')}
              required
              className={authInputClass}
            />
            <p className="mt-1 text-xs text-text-secondary">
              {t('auth.login.workspaceIdHelp')}
            </p>
          </div>
          <InputField
            id="username"
            type="text"
            label={t('auth.login.username')}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder={t('auth.login.usernamePlaceholder')}
            autoComplete="username"
            required
            className={authInputClass}
          />
          <InputField
            id="team-password"
            type="password"
            label={t('auth.login.password')}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={t('auth.login.passwordPlaceholder')}
            autoComplete="current-password"
            required
            className={authInputClass}
          />
        </>
      )}

      {formError ? (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}

      <AuthPrimaryButton loading={loading} disabled={loading}>
        {loading ? t('auth.login.submitting') : t('auth.login.submit')}
      </AuthPrimaryButton>

      <button
        type="button"
        className={cn(
          'w-full text-sm font-medium text-primary transition-colors hover:underline',
        )}
        onClick={onTeamModeToggle}
      >
        {teamMode ? t('auth.login.teamHide') : t('auth.login.teamToggle')}
      </button>
    </form>
  );
}
