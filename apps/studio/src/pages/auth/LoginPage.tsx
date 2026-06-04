import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { useLogin } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/utils/statusMessage';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();

  const [teamMode, setTeamMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [username, setUsername] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await login.mutateAsync(
        teamMode
          ? { workspaceId: workspaceId.trim(), username: username.trim(), password }
          : { email: email.trim(), password },
      );
      void navigate({ to: '/projects' });
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

  return (
    <AuthLayout>
      <AuthCard
        title={t('auth.login.title')}
        subtitle={t('auth.login.subtitle')}
        footer={
          <p>
            {t('auth.login.noAccount')}{' '}
            <Link
              to="/signup"
              className="text-primary font-semibold hover:underline"
            >
              {t('auth.login.signupLink')}
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!teamMode ? (
            <>
              <InputField
                id="email"
                type="email"
                label={t('auth.login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <InputField
                id="password"
                type="password"
                label={t('auth.login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </>
          ) : (
            <>
              <div>
                <InputField
                  id="workspaceId"
                  type="text"
                  label={t('auth.login.workspaceId')}
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  required
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
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <InputField
                id="team-password"
                type="password"
                label={t('auth.login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </>
          )}

          {formError && (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={login.isPending}
            disabled={login.isPending}
          >
            {t('auth.login.submit')}
          </Button>

          <button
            type="button"
            className="w-full text-sm text-primary hover:underline"
            onClick={() => {
              setTeamMode((v) => !v);
              setFormError(null);
            }}
          >
            {teamMode
              ? t('auth.login.teamHide')
              : t('auth.login.teamToggle')}
          </button>
        </form>

        <AuthDivider />
        <GoogleAuthButton />
      </AuthCard>
    </AuthLayout>
  );
}
