import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';

import { ActionsTable } from '@/components/actions/ActionsTable';
import { PageHeader } from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/hooks/use-projects';
import { canWriteActions } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';

export default function ProjectActionsPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);

  const projectQuery = useProject(projectId ?? null);
  const canWrite = canWriteActions(session);
  const projectName = projectQuery.data?.name;

  return (
    <>
      <PageHeader
        title={t('projectPages.sections.actions.title')}
        subtitle={
          projectName
            ? t('projectPages.sectionSubtitle', { project: projectName })
            : t('projectPages.sections.actions.emptyDescription')
        }
        actions={
          canWrite && projectId ? (
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => openModal('createAction', { projectId })}
            >
              {t('projectActions.create.button')}
            </Button>
          ) : null
        }
      />

      {projectId ? <ActionsTable projectId={projectId} /> : null}
    </>
  );
}
