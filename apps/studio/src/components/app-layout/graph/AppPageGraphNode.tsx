import type { AppPageData } from '@ahmedrioueche/actocore-shared';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Map, Pencil, Plus, Trash2 } from 'lucide-react';
import { memo, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useDeleteAppPage } from '@/hooks/use-app-pages';
import { useModalStore } from '@/stores/modal';

export type AppPageGraphNodeData = {
  page: AppPageData;
  actionNames: string[];
  projectId: string;
  canWrite: boolean;
};

const MAX_VISIBLE_ITEMS = 3;

function AppPageGraphNodeComponent({
  data,
}: NodeProps & { data: AppPageGraphNodeData }) {
  const { t } = useTranslation();
  const openModal = useModalStore((state) => state.openModal);
  const openConfirm = useModalStore((state) => state.openConfirm);
  const { page, actionNames, projectId, canWrite } = data;
  const deletePage = useDeleteAppPage(projectId);
  const functionalities = page.functionalities ?? [];
  const visibleFunctionalities = functionalities.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenFunctionalityCount =
    functionalities.length - visibleFunctionalities.length;
  const visibleActions = actionNames.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenActionCount = actionNames.length - visibleActions.length;

  const handleEdit = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    openModal('editAppPage', { projectId, pageId: page.id });
  };

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    openConfirm({
      title: t('projectLayout.delete.title'),
      text: t('projectLayout.delete.text', { title: page.title }),
      confirmText: t('projectLayout.delete.confirm'),
      confirmVariant: 'danger',
      onConfirm: () => {
        void deletePage.mutateAsync(page.id);
      },
    });
  };

  const handleAddFunctionality = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    openModal('createAppPageFunctionality', { projectId, pageId: page.id });
  };

  return (
    <div className="w-72 rounded-2xl border border-border bg-surface shadow-sm">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-border !bg-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-border !bg-primary"
      />

      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <Map className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">
                {page.title}
              </p>
              <p className="truncate font-mono text-xs text-text-secondary">
                {page.route}
              </p>
            </div>
          </div>
          {canWrite ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={handleEdit}
                className="nodrag rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                aria-label={t('projectLayout.graph.editPage')}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="nodrag rounded-lg p-1.5 text-text-secondary hover:bg-danger-surface hover:text-danger"
                aria-label={t('projectLayout.graph.deletePage')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
        {!page.enabled ? (
          <span className="mt-2 inline-flex rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
            {t('projectLayout.graph.disabledBadge')}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            {t('projectLayout.graph.actionsSection')}
          </p>
          {actionNames.length === 0 ? (
            <p className="mt-1 text-xs text-text-secondary">
              {t('projectLayout.graph.noActions')}
            </p>
          ) : (
            <ul className="mt-1 flex flex-wrap gap-1">
              {visibleActions.map((name) => (
                <li
                  key={name}
                  className="rounded-md bg-surface-hover px-2 py-0.5 font-mono text-[11px] text-text-primary"
                >
                  {name}
                </li>
              ))}
              {hiddenActionCount > 0 ? (
                <li className="rounded-md bg-surface-hover px-2 py-0.5 text-[11px] text-text-secondary">
                  {t('projectLayout.graph.moreCount', {
                    count: hiddenActionCount,
                  })}
                </li>
              ) : null}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              {t('projectLayout.graph.functionalitiesSection')}
            </p>
            {canWrite ? (
              <button
                type="button"
                onClick={handleAddFunctionality}
                className="nodrag inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-surface-hover"
              >
                <Plus className="h-3 w-3" />
                {t('projectLayout.graph.addFunctionality')}
              </button>
            ) : null}
          </div>
          {functionalities.length === 0 ? (
            <p className="mt-1 text-xs text-text-secondary">
              {t('projectLayout.graph.noFunctionalities')}
            </p>
          ) : (
            <ul className="mt-1 space-y-1">
              {visibleFunctionalities.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-border px-2 py-1.5"
                >
                  <p className="truncate text-xs font-medium text-text-primary">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-text-secondary">
                      {item.description}
                    </p>
                  ) : null}
                </li>
              ))}
              {hiddenFunctionalityCount > 0 ? (
                <li className="text-[11px] text-text-secondary">
                  {t('projectLayout.graph.moreCount', {
                    count: hiddenFunctionalityCount,
                  })}
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export const AppPageGraphNode = memo(AppPageGraphNodeComponent);
