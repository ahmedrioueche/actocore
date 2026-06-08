import { UNCATEGORIZED_SECTION_ID } from '@ahmedrioueche/actocore-shared';
import { Code2, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';

import { ActionsTable } from '@/components/actions/ActionsTable';
import { SectionSidebar } from '@/components/actions/SectionSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/hooks/use-projects';
import { useProjectActions } from '@/hooks/use-actions';
import { canWriteActions } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';

export default function ProjectActionsPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);

  const projectQuery = useProject(projectId ?? null);
  const actionsQuery = useProjectActions(projectId ?? null, {
    page: 1,
    limit: 1,
  });
  const canWrite = canWriteActions(session);
  const projectName = projectQuery.data?.name;
  const hasActions = (actionsQuery.data?.total ?? 0) > 0;

  const [selectedSectionId, setSelectedSectionId] = useState<
    string | undefined
  >(undefined);

  const realSectionId =
    selectedSectionId && selectedSectionId !== UNCATEGORIZED_SECTION_ID
      ? selectedSectionId
      : undefined;

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
          projectId ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                icon={<Code2 className="h-4 w-4" />}
                disabled={!hasActions}
                onClick={() =>
                  openModal('actionsSdkCode', {
                    projectId,
                  })
                }
              >
                {t('projectActions.generateCode.button')}
              </Button>
              {canWrite ? (
                <Button
                  icon={<Zap className="h-4 w-4" />}
                  onClick={() =>
                    openModal('createAction', {
                      projectId,
                      defaultSectionId: realSectionId,
                    })
                  }
                >
                  {t('projectActions.create.button')}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {projectId ? (
        <div className="flex gap-6">
          <SectionSidebar
            projectId={projectId}
            selectedSectionId={selectedSectionId}
            onSelect={setSelectedSectionId}
            canWrite={canWrite}
          />
          <div className="min-w-0 flex-1">
            <ActionsTable projectId={projectId} sectionId={selectedSectionId} />
          </div>
        </div>
      ) : null}
    </>
  );
}
