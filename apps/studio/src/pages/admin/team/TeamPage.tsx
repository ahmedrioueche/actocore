import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Error from '@/components/ui/Error';
import {
  useDeletePlatformManager,
  usePlatformManagers,
} from '@/hooks/use-platform-auth';
import { useModalStore } from '@/stores/modal';

import { TeamManagersTable } from './TeamManagersTable';

export default function TeamPage() {
  const { t } = useTranslation();
  const openModal = useModalStore((state) => state.openModal);
  const managersQuery = usePlatformManagers();
  const deleteManager = useDeletePlatformManager();
  const managers = managersQuery.data ?? [];

  return (
    <>
      <PageHeader
        title={t('admin.team.title')}
        subtitle={t('admin.team.subtitle')}
        actions={
          <Button
            type="button"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => openModal('createPlatformManager', {})}
          >
            {t('admin.team.addManager')}
          </Button>
        }
      />

      {managersQuery.isError ? (
        <Error onRetry={() => void managersQuery.refetch()} />
      ) : (
        <TeamManagersTable
          managers={managers}
          isLoading={managersQuery.isLoading}
          deletePending={deleteManager.isPending}
          onRemove={(manager) => {
            void deleteManager.mutateAsync(manager.userId);
          }}
        />
      )}
    </>
  );
}
