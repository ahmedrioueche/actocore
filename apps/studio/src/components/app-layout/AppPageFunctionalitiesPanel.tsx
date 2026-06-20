import type { AppPageFunctionality } from '@ahmedrioueche/actocore-shared';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';
import { useDeleteAppPageFunctionality } from '@/hooks/use-app-pages';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getApiErrorMessage } from '@/utils/statusMessage';

interface AppPageFunctionalitiesPanelProps {
  projectId: string;
  pageId: string;
  functionalities: AppPageFunctionality[];
  canWrite: boolean;
}

export function AppPageFunctionalitiesPanel({
  projectId,
  pageId,
  functionalities,
  canWrite,
}: AppPageFunctionalitiesPanelProps) {
  const { t } = useTranslation();
  const openModal = useModalStore((state) => state.openModal);
  const openConfirm = useModalStore((state) => state.openConfirm);
  const deleteFunctionality = useDeleteAppPageFunctionality(projectId);

  const handleCreate = () => {
    openModal('createAppPageFunctionality', { projectId, pageId });
  };

  const handleEdit = (functionalityId: string) => {
    openModal('editAppPageFunctionality', {
      projectId,
      pageId,
      functionalityId,
    });
  };

  const handleDelete = (item: AppPageFunctionality) => {
    openConfirm({
      title: t('projectLayout.functionalities.delete.title'),
      text: t('projectLayout.functionalities.delete.text', { title: item.title }),
      confirmText: t('projectLayout.functionalities.delete.confirm'),
      confirmVariant: 'danger',
      onConfirm: () => {
        void deleteFunctionality
          .mutateAsync({ pageId, functionalityId: item.id })
          .catch((err) => {
            const code = (err as Error & { errorCode?: string }).errorCode;
            toast.error(
              getApiErrorMessage(t, {
                errorCode: code,
                message: err instanceof Error ? err.message : undefined,
              }),
            );
          });
      },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-text-primary">
            {t('projectLayout.functionalities.title')}
          </h4>
          <p className="mt-1 text-sm text-text-secondary">
            {t('projectLayout.functionalities.description')}
          </p>
        </div>
        {canWrite ? (
          <Button
            type="button"
            icon={<Plus className="h-4 w-4" />}
            onClick={handleCreate}
          >
            {t('projectLayout.functionalities.create.button')}
          </Button>
        ) : null}
      </div>

      {functionalities.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          {t('projectLayout.functionalities.empty')}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {functionalities.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {item.title}
                </p>
                <p className="font-mono text-xs text-text-secondary">
                  {item.id}
                </p>
                {item.description ? (
                  <p className="mt-1 text-xs text-text-secondary">
                    {item.description}
                  </p>
                ) : null}
              </div>
              {canWrite ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(item.id)}
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    aria-label={t('projectLayout.functionalities.edit.button')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover hover:text-danger"
                    aria-label={t('projectLayout.functionalities.delete.confirm')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
