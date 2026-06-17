import { Link, useParams } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DocCodeBlock } from '@/components/projects/DocCodeBlock';
import {
  PROJECT_DOCS_ENV_EXAMPLE,
  PROJECT_DOCS_INSTALL_COMMAND,
  PROJECT_DOCS_QUICK_START,
} from '@/constants/project-docs';
import { useProjectActions } from '@/hooks/use-actions';
import { buildSdkIntegrationCode } from '@/utils/action-schema-builder';

const ACTIONS_FETCH_LIMIT = 100;

export default function ProjectDocsQuickStartPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const actionsQuery = useProjectActions(projectId ?? null, {
    page: 1,
    limit: ACTIONS_FETCH_LIMIT,
  });

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

  return (
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
            params={{ projectId }}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {t('nav.project.actions')}
          </Link>
          .
        </p>
      )}
    </section>
  );
}
