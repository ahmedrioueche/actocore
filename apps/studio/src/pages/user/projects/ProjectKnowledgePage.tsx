import { UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from '@tanstack/react-router';

import { KnowledgeTable } from '@/components/knowledge/KnowledgeTable';
import { PageHeader } from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/hooks/use-projects';
import { canWriteKnowledge } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';

export default function ProjectKnowledgePage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);

  const projectQuery = useProject(projectId ?? null);
  const canWrite = canWriteKnowledge(session);
  const projectName = projectQuery.data?.name;

  return (
    <>
      <PageHeader
        title={t('projectPages.sections.knowledge.title')}
        subtitle={
          projectName
            ? t('projectPages.sectionSubtitle', { project: projectName })
            : t('projectPages.sections.knowledge.emptyDescription')
        }
        actions={
          canWrite && projectId ? (
            <Button
              icon={<UploadCloud className="h-4 w-4" />}
              onClick={() => openModal('uploadKnowledge', { projectId })}
            >
              {t('knowledge.upload.button')}
            </Button>
          ) : null
        }
      />

      {projectId ? <KnowledgeTable projectId={projectId} /> : null}
    </>
  );
}
