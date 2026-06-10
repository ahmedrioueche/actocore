import { useNavigate, useParams } from '@tanstack/react-router';
import { StudioPermission } from '@ahmedrioueche/actocore-shared';
import {
  BarChart3,
  BookOpen,
  FileText,
  KeyRound,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AnalyticsPanel } from '@/components/admin/analytics/AnalyticsPanel';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectOverviewResourceCard } from '@/components/projects/overview/ProjectOverviewResourceCard';
import { ProjectOverviewSetupChecklist } from '@/components/projects/overview/ProjectOverviewSetupChecklist';
import { UsageMetricGrid } from '@/components/usage';
import { useUsageSummaryMetrics } from '@/components/usage/use-usage-summary-metrics';
import Button from '@/components/ui/Button';
import Error from '@/components/ui/Error';
import Tip from '@/components/ui/Tip';
import { useAuth } from '@/context/AuthContext';
import { useProjectOverview } from '@/hooks/use-project-overview';
import { canAccessNavItem } from '@/lib/studio-permissions';

export default function ProjectOverviewPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();

  const { projectQuery, counts, countsLoading, usage } = useProjectOverview(
    projectId ?? null,
  );

  const project = projectQuery.data;
  const canReadUsage = canAccessNavItem(session, StudioPermission.USAGE_READ);
  const canReadApiKeys = canAccessNavItem(
    session,
    StudioPermission.API_KEYS_READ,
  );
  const canReadKnowledge = canAccessNavItem(
    session,
    StudioPermission.KNOWLEDGE_READ,
  );
  const canReadActions = canAccessNavItem(
    session,
    StudioPermission.ACTIONS_READ,
  );
  const usageMetrics = useUsageSummaryMetrics(
    usage.summary,
    usage.breakdown,
    usage.isLoading,
  );

  const createdLabel = useMemo(() => {
    if (!project?.createdAt) return undefined;
    return new Date(project.createdAt).toLocaleDateString(i18n.language, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [project?.createdAt, i18n.language]);

  const setupItems = useMemo(
    () =>
      [
        canReadApiKeys
          ? {
              key: 'apiKeys' as const,
              to: '/projects/$projectId/api-keys',
              icon: KeyRound,
              titleKey: 'nav.project.apiKeys',
              descriptionKey: 'projectOverview.setup.apiKeys',
              complete: counts.apiKeys > 0,
            }
          : null,
        canReadKnowledge
          ? {
              key: 'knowledge' as const,
              to: '/projects/$projectId/knowledge',
              icon: BookOpen,
              titleKey: 'nav.project.knowledge',
              descriptionKey: 'projectOverview.setup.knowledge',
              complete: counts.knowledge > 0,
            }
          : null,
        canReadActions
          ? {
              key: 'actions' as const,
              to: '/projects/$projectId/actions',
              icon: Zap,
              titleKey: 'nav.project.actions',
              descriptionKey: 'projectOverview.setup.actions',
              complete: counts.actions > 0,
            }
          : null,
      ].filter((item) => item != null),
    [
      canReadActions,
      canReadApiKeys,
      canReadKnowledge,
      counts.actions,
      counts.apiKeys,
      counts.knowledge,
    ],
  );

  if (!projectId) {
    return null;
  }

  const routeParams = { projectId };
  const showGettingStartedTip =
    !countsLoading &&
    counts.apiKeys === 0 &&
    counts.knowledge === 0 &&
    counts.actions === 0;

  return (
    <>
      <PageHeader
        title={t('projectOverview.title')}
        subtitle={
          project?.name
            ? t('projectPages.sectionSubtitle', { project: project.name })
            : undefined
        }
        actions={
          <Button
            variant="outline"
            icon={<FileText className="h-4 w-4" />}
            onClick={() =>
              void navigate({
                to: '/projects/$projectId/docs',
                params: routeParams,
              })
            }
          >
            {t('projectOverview.viewDocs')}
          </Button>
        }
      />

      <div className="space-y-8">
        {project ? (
          <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {t('projectPages.fields.name')}
              </p>
              <p className="mt-1 text-base font-semibold text-text-primary">
                {project.name}
              </p>
            </div>
            {createdLabel ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {t('projectPages.fields.created')}
                </p>
                <p className="mt-1 text-base text-text-primary">
                  {createdLabel}
                </p>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {t('projectPages.fields.id')}
              </p>
              <p className="mt-1 break-all font-mono text-sm text-text-primary">
                {project.id}
              </p>
            </div>
          </section>
        ) : null}

        {showGettingStartedTip ? (
          <Tip title={t('projectOverview.gettingStarted.title')}>
            <p>{t('projectOverview.gettingStarted.body')}</p>
          </Tip>
        ) : null}

        {(canReadApiKeys || canReadKnowledge || canReadActions) && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t('projectOverview.resources.title')}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {t('projectOverview.resources.description')}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {canReadApiKeys ? (
                <ProjectOverviewResourceCard
                  to="/projects/$projectId/api-keys"
                  params={routeParams}
                  icon={KeyRound}
                  label={t('nav.project.apiKeys')}
                  count={counts.apiKeys}
                  isLoading={countsLoading}
                />
              ) : null}
              {canReadKnowledge ? (
                <ProjectOverviewResourceCard
                  to="/projects/$projectId/knowledge"
                  params={routeParams}
                  icon={BookOpen}
                  label={t('nav.project.knowledge')}
                  count={counts.knowledge}
                  isLoading={countsLoading}
                />
              ) : null}
              {canReadActions ? (
                <ProjectOverviewResourceCard
                  to="/projects/$projectId/actions"
                  params={routeParams}
                  icon={Zap}
                  label={t('nav.project.actions')}
                  count={counts.actions}
                  isLoading={countsLoading}
                />
              ) : null}
            </div>
          </section>
        )}

        {canReadUsage ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {t('projectOverview.usage.title')}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {t('projectOverview.usage.description')}
                </p>
              </div>
              <Button
                variant="outline"
                icon={<BarChart3 className="h-4 w-4" />}
                onClick={() =>
                  void navigate({
                    to: '/projects/$projectId/usage',
                    params: routeParams,
                  })
                }
              >
                {t('projectOverview.usage.viewAll')}
              </Button>
            </div>

            {usage.isError ? (
              <Error onRetry={usage.refetch} />
            ) : (
              <AnalyticsPanel
                title={t('usage.metrics.requests')}
                description={t('projectOverview.usage.panelDescription')}
              >
                <UsageMetricGrid
                  metrics={usageMetrics.metrics}
                  isLoading={usage.isLoading}
                />
              </AnalyticsPanel>
            )}
          </section>
        ) : null}

        {setupItems.length > 0 ? (
          <ProjectOverviewSetupChecklist
            projectId={projectId}
            counts={counts}
            items={setupItems}
          />
        ) : null}
      </div>
    </>
  );
}
