import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useLogout } from '@/hooks/use-auth';

export default function ProjectsPlaceholderPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {t('projects.placeholderTitle')}
          </h1>
          {session?.account?.name && (
            <p className="text-sm text-text-secondary">
              {session.account.name}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          loading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {t('auth.logout')}
        </Button>
      </header>
      <main className="p-6 max-w-3xl">
        <p className="text-text-secondary">{t('projects.placeholderSubtitle')}</p>
      </main>
    </div>
  );
}
