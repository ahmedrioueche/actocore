import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { AsyncContent } from '@/components/states';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProjectsList } from '@/hooks/use-projects';
import { canWriteProjects } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);
  const projectsQuery = useProjectsList();
  const projects = projectsQuery.data ?? [];
  const canWrite = canWriteProjects(session);

  return (
    <>
      <PageHeader
        title={t('projects.title')}
        subtitle={
          projectsQuery.isLoading
            ? undefined
            : t('projects.listSubtitle', { count: projects.length })
        }
        actions={
          canWrite ? (
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => openModal('createProject', {})}
            >
              {t('projects.create.button')}
            </Button>
          ) : undefined
        }
      />

      <AsyncContent
        isLoading={projectsQuery.isLoading}
        isError={projectsQuery.isError}
        isEmpty={!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0}
        emptyTitle={t('projects.emptyTitle')}
        emptyDescription={t('projects.emptyDescription')}
        onRetry={() => void projectsQuery.refetch()}
        loadingVariant="cards"
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </AsyncContent>
    </>
  );
}
