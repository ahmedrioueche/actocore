import { FolderKanban } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { AsyncContent } from '@/components/states';
import { useProjectsList } from '@/hooks/use-projects';

export default function ProjectsPage() {
  const { t } = useTranslation();
  const projectsQuery = useProjectsList();
  const projects = projectsQuery.data ?? [];

  return (
    <>
      <PageHeader
        title={t('projects.title')}
        subtitle={
          projectsQuery.isLoading
            ? undefined
            : t('projects.listSubtitle', { count: projects.length })
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
