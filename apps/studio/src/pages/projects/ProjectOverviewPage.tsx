import { useParams } from '@tanstack/react-router';
import { LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import Error from '@/components/ui/Error';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProject } from '@/hooks/use-projects';

export default function ProjectOverviewPage() {
  const { t, i18n } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const projectQuery = useProject(projectId ?? null);
  const project = projectQuery.data;

  return (
    <>
      <PageHeader
        title={t('nav.project.overview')}
        subtitle={t('projectPages.overviewSubtitle')}
      />

      {projectQuery.isError ? (
        <Error onRetry={() => void projectQuery.refetch()} />
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm md:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
              <LayoutDashboard
                className="h-5 w-5 text-primary-contrast"
                aria-hidden
              />
            </div>
            <dl className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {t('projectPages.fields.name')}
                </dt>
                {projectQuery.isLoading ? (
                  <Skeleton className="mt-2 h-4 w-40" />
                ) : (
                  <dd className="mt-1 text-sm font-medium text-text-primary">
                    {project?.name}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {t('projectPages.fields.created')}
                </dt>
                {projectQuery.isLoading ? (
                  <Skeleton className="mt-2 h-4 w-32" />
                ) : (
                  <dd className="mt-1 text-sm font-medium text-text-primary">
                    {project
                      ? new Date(project.createdAt).toLocaleDateString(
                          i18n.language,
                          {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          },
                        )
                      : null}
                  </dd>
                )}
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {t('projectPages.fields.id')}
                </dt>
                {projectQuery.isLoading ? (
                  <Skeleton className="mt-2 h-4 w-full max-w-md" />
                ) : (
                  <dd className="mt-1 break-all font-mono text-sm text-text-primary">
                    {project?.id}
                  </dd>
                )}
              </div>
            </dl>
          </div>
        </section>
      )}
    </>
  );
}
