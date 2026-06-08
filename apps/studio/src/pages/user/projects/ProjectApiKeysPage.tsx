import { KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';

import { ApiKeysTable } from '@/components/api-keys/ApiKeysTable';
import { PageHeader } from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/hooks/use-projects';
import { canWriteApiKeys } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';

export default function ProjectApiKeysPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);

  const projectQuery = useProject(projectId ?? null);
  const canWrite = canWriteApiKeys(session);
  const projectName = projectQuery.data?.name;

  return (
    <>
      <PageHeader
        title={t('projectPages.sections.apiKeys.title')}
        subtitle={
          projectName
            ? t('projectPages.sectionSubtitle', { project: projectName })
            : t('projectPages.sections.apiKeys.emptyDescription')
        }
        actions={
          canWrite && projectId ? (
            <Button
              icon={<KeyRound className="h-4 w-4" />}
              onClick={() => openModal('createApiKey', { projectId })}
            >
              {t('apiKeys.create.button')}
            </Button>
          ) : null
        }
      />

      {projectId ? <ApiKeysTable projectId={projectId} /> : null}
    </>
  );
}
