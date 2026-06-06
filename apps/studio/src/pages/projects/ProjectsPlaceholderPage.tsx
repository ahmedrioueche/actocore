import { FolderKanban } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import AppShell from '@/components/layout/AppShell';
import { EmptyState } from '@/components/states';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useLogout } from '@/hooks/use-auth';

export default function ProjectsPlaceholderPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const logout = useLogout();

  return (
    <AppShell
      title={t('projects.placeholderTitle')}
      subtitle={session?.account?.name}
      headerActions={
        <Button
          type="button"
          variant="outline"
          loading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {t('auth.logout')}
        </Button>
      }
    >
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={FolderKanban}
          title={t('projects.emptyTitle')}
          description={t('projects.emptyDescription')}
        />
      </div>
    </AppShell>
  );
}
