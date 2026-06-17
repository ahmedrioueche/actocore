import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthFormHeader } from '@/components/auth/AuthFormHeader';
import { AuthGlassCard } from '@/components/auth/AuthGlassCard';
import { AuthLayout } from '@/components/auth/AuthLayout';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import { usePlatformLogin } from '@/hooks/use-platform-auth';
import { getDefaultAdminPath } from '@/lib/platform-permissions';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = usePlatformLogin();

  const [masterMode, setMasterMode] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await login.mutateAsync(
        masterMode
          ? { email: email.trim(), password }
          : { username: username.trim(), password },
      );
      void navigate({
        to: getDefaultAdminPath({
          user: session.user,
          platformAccountId: session.platformAccountId,
          isPlatformMaster: session.isPlatformMaster,
          platformPermissions: session.platformPermissions,
        }),
      });
    } catch (err) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  return (
    <AuthLayout>
      <AuthFormHeader
        title={t('admin.login.title')}
        subtitle={t('admin.login.subtitle')}
      />
      <AuthGlassCard>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMasterMode(true)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              masterMode ? 'bg-primary text-white' : 'bg-surface-hover text-text-secondary'
            }`}
          >
            {t('admin.login.masterTab')}
          </button>
          <button
            type="button"
            onClick={() => setMasterMode(false)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              !masterMode ? 'bg-primary text-white' : 'bg-surface-hover text-text-secondary'
            }`}
          >
            {t('admin.login.managerTab')}
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {masterMode ? (
            <InputField
              label={t('admin.login.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('admin.login.emailPlaceholder')}
              autoComplete="username"
            />
          ) : (
            <InputField
              label={t('admin.login.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('admin.login.usernamePlaceholder')}
              autoComplete="username"
            />
          )}
          <InputField
            label={t('admin.login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('admin.login.passwordPlaceholder')}
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" loading={login.isPending}>
            {t('admin.login.submit')}
          </Button>
        </form>
      </AuthGlassCard>
    </AuthLayout>
  );
}
