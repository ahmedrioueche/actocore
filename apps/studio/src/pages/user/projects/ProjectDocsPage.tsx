import { Link, useParams } from '@tanstack/react-router';
import {
  BookOpen,
  Code2,
  KeyRound,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SdkUpdatesSection } from '@/components/projects/SdkUpdatesSection';
import { DocCodeBlock } from '@/components/projects/DocCodeBlock';
import { DocStepLink } from '@/components/projects/DocStepLink';
import { PageHeader } from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Tip from '@/components/ui/Tip';
import {
  PROJECT_DOCS_ENV_EXAMPLE,
  PROJECT_DOCS_INSTALL_COMMAND,
  PROJECT_DOCS_QUICK_START,
} from '@/constants/project-docs';
import { useAuth } from '@/context/AuthContext';
import { useProjectActions } from '@/hooks/use-actions';
import { useProject } from '@/hooks/use-projects';
import { canWriteActions } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';
import { buildSdkIntegrationCode } from '@/utils/action-schema-builder';

const ACTIONS_FETCH_LIMIT = 100;

export default function ProjectDocsPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);

  const projectQuery = useProject(projectId ?? null);
  const actionsQuery = useProjectActions(projectId ?? null, {
    page: 1,
    limit: ACTIONS_FETCH_LIMIT,
  });

  const projectName = projectQuery.data?.name;
  const canGenerateActionCode = canWriteActions(session);
  const enabledActions =
    actionsQuery.data?.items.filter((action) => action.enabled) ?? [];

  const quickStartCode = useMemo(() => {
    if (enabledActions.length > 0 && actionsQuery.data) {
      return buildSdkIntegrationCode(actionsQuery.data.items);
    }
    return PROJECT_DOCS_QUICK_START;
  }, [actionsQuery.data, enabledActions.length]);

  if (!projectId) {
    return null;
  }

  const routeParams = { projectId };

  return (
    <>
      <PageHeader
        title={t('nav.project.docs')}
        subtitle={
          projectName
            ? t('projectDocs.subtitle', { project: projectName })
            : t('projectDocs.subtitleFallback')
        }
        actions={
          canGenerateActionCode && enabledActions.length > 0 ? (
            <Button
              variant="outline"
              icon={<Code2 className="h-4 w-4" />}
              onClick={() => openModal('actionsSdkCode', { projectId })}
            >
              {t('projectDocs.viewActionCode')}
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-8">
        <Tip title={t('projectDocs.gettingStarted.title')}>
          <p>{t('projectDocs.gettingStarted.body')}</p>
        </Tip>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t('projectDocs.quickStart.title')}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t('projectDocs.quickStart.description')}
            </p>
          </div>

          <DocCodeBlock
            label={t('projectDocs.quickStart.installLabel')}
            code={PROJECT_DOCS_INSTALL_COMMAND}
          />
          <DocCodeBlock
            label={t('projectDocs.quickStart.envLabel')}
            code={PROJECT_DOCS_ENV_EXAMPLE}
          />
          <DocCodeBlock
            label={
              enabledActions.length > 0
                ? t('projectDocs.quickStart.componentWithActions')
                : t('projectDocs.quickStart.componentLabel')
            }
            code={quickStartCode}
          />

          {enabledActions.length > 0 ? (
            <p className="text-xs text-text-secondary">
              {t('projectDocs.quickStart.actionsHint', {
                count: enabledActions.length,
              })}
            </p>
          ) : (
            <p className="text-xs text-text-secondary">
              {t('projectDocs.quickStart.noActionsHint')}{' '}
              <Link
                to="/projects/$projectId/actions"
                params={routeParams}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {t('nav.project.actions')}
              </Link>
              .
            </p>
          )}
        </section>

        <SdkUpdatesSection />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t('projectDocs.setup.title')}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t('projectDocs.setup.description')}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DocStepLink
              step={1}
              to="/projects/$projectId/api-keys"
              params={routeParams}
              icon={KeyRound}
              title={t('nav.project.apiKeys')}
              description={t('projectDocs.setup.apiKeys')}
            />
            <DocStepLink
              step={2}
              to="/projects/$projectId/knowledge"
              params={routeParams}
              icon={BookOpen}
              title={t('nav.project.knowledge')}
              description={t('projectDocs.setup.knowledge')}
            />
            <DocStepLink
              step={3}
              to="/projects/$projectId/actions"
              params={routeParams}
              icon={Zap}
              title={t('nav.project.actions')}
              description={t('projectDocs.setup.actions')}
            />
            <DocStepLink
              step={4}
              to="/projects/$projectId/sdk-config"
              params={routeParams}
              icon={SlidersHorizontal}
              title={t('nav.project.sdkConfig')}
              description={t('projectDocs.setup.sdkConfig')}
            />
          </div>
        </section>
      </div>
    </>
  );
}
