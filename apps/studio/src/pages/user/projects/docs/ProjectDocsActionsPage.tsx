import { useParams } from '@tanstack/react-router';
import { Code2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProjectActions } from '@/hooks/use-actions';
import { canWriteActions } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';

const ACTIONS_FETCH_LIMIT = 100;

export default function ProjectDocsActionsPage() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { session } = useAuth();
  const openModal = useModalStore((state) => state.openModal);
  const actionsQuery = useProjectActions(projectId ?? null, {
    page: 1,
    limit: ACTIONS_FETCH_LIMIT,
  });

  const enabledActions =
    actionsQuery.data?.items.filter((action) => action.enabled) ?? [];
  const canGenerateActionCode = canWriteActions(session);

  if (!projectId) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t('projectDocs.sections.actions.title')}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t('projectDocs.sections.actions.description')}
          </p>
        </div>
        {canGenerateActionCode && enabledActions.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            icon={<Code2 className="h-4 w-4" />}
            onClick={() => openModal('actionsSdkCode', { projectId })}
          >
            {t('projectDocs.viewActionCode')}
          </Button>
        ) : null}
      </div>

      <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
        {(t('projectDocs.sections.actions.bullets', {
          returnObjects: true,
        }) as string[]).map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}
