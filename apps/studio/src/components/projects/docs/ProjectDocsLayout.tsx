import { Outlet, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectDocsSidebar } from '@/components/projects/docs/ProjectDocsSidebar';
import { useProject } from '@/hooks/use-projects';

export default function ProjectDocsLayout() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const projectQuery = useProject(projectId ?? null);
  const projectName = projectQuery.data?.name;

  if (!projectId) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={t('nav.project.docs')}
        subtitle={
          projectName
            ? t('projectDocs.subtitle', { project: projectName })
            : t('projectDocs.subtitleFallback')
        }
      />

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <ProjectDocsSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </>
  );
}
