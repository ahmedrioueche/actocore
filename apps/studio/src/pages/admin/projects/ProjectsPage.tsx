import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import Error from '@/components/ui/Error';
import InputField from '@/components/ui/InputField';
import { useAdminListState } from '@/hooks/use-admin-list-state';
import { usePlatformProjects } from '@/hooks/use-platform-data';

import { ProjectsTable } from './ProjectsTable';

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { page, setPage, searchInput, setSearchInput, search, applySearch } =
    useAdminListState();
  const projectsQuery = usePlatformProjects(search, page);
  const projects = projectsQuery.data?.items ?? [];

  return (
    <>
      <PageHeader title={t('admin.projects.title')} subtitle={t('admin.projects.subtitle')} />
      <form
        className="mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch();
        }}
      >
        <InputField
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('admin.projects.searchPlaceholder')}
        />
      </form>
      {projectsQuery.isError ? (
        <Error onRetry={() => void projectsQuery.refetch()} />
      ) : (
        <ProjectsTable
          projects={projects}
          isLoading={projectsQuery.isLoading}
          meta={projectsQuery.data}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
