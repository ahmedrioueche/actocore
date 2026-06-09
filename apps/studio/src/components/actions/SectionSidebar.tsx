import { UNCATEGORIZED_SECTION_ID } from '@ahmedrioueche/actocore-shared';
import { Inbox, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { cn } from '@/utils/helper';
import {
  useActionSections,
  useDeleteActionSection,
  useUpdateActionSection,
} from '@/hooks/use-action-sections';
import { useModalStore } from '@/stores/modal';

interface SectionSidebarProps {
  projectId: string;
  selectedSectionId: string | undefined;
  onSelect: (sectionId: string | undefined) => void;
  canWrite: boolean;
}

const ITEM_BASE =
  'group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors md:w-full';

export function SectionSidebar({
  projectId,
  selectedSectionId,
  onSelect,
  canWrite,
}: SectionSidebarProps) {
  const { t } = useTranslation();
  const openModal = useModalStore((state) => state.openModal);
  const openConfirm = useModalStore((state) => state.openConfirm);

  const sectionsQuery = useActionSections(projectId);
  const updateSection = useUpdateActionSection(projectId);
  const deleteSection = useDeleteActionSection(projectId);

  const sections = sectionsQuery.data ?? [];

  const itemClass = (active: boolean) =>
    `${ITEM_BASE} ${
      active
        ? 'bg-surface-hover text-text-primary'
        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
    }`;

  return (
    <aside className="w-full shrink-0 space-y-3 md:w-64">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {t('projectActions.sections.title')}
        </span>
        {canWrite ? (
          <button
            type="button"
            onClick={() => openModal('createSection', { projectId })}
            className="rounded-md p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label={t('projectActions.sections.create.button')}
            title={t('projectActions.sections.create.button')}
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex gap-1 overflow-x-auto pb-1 hide-scrollbar md:block md:space-y-1 md:overflow-visible md:pb-0">
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className={itemClass(selectedSectionId === undefined)}
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">
            {t('projectActions.sections.all')}
          </span>
        </button>

        {sections.map((section) => {
          const active = selectedSectionId === section.id;
          return (
            <div key={section.id} className={cn(itemClass(active), 'md:pr-1')}>
              <button
                type="button"
                onClick={() => onSelect(section.id)}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: section.color ?? '#64748b' }}
                />
                <span
                  className={`truncate ${section.enabled ? '' : 'line-through opacity-60'}`}
                >
                  {section.name}
                </span>
                {section.actionCount ? (
                  <span className="ml-auto rounded-full bg-surface px-1.5 py-0.5 text-xs text-text-secondary">
                    {section.actionCount}
                  </span>
                ) : null}
              </button>

              {canWrite ? (
                <div className="hidden items-center gap-1 md:flex">
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ToggleSwitch
                      checked={section.enabled}
                      ariaLabel={
                        section.enabled
                          ? t('projectActions.sections.disable')
                          : t('projectActions.sections.enable')
                      }
                      onChange={(next) => {
                        void updateSection.mutateAsync({
                          sectionId: section.id,
                          body: { enabled: next },
                        });
                      }}
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      openModal('editSection', {
                        projectId,
                        sectionId: section.id,
                      })
                    }
                    className="rounded p-1 text-text-secondary opacity-0 transition hover:text-text-primary group-hover:opacity-100"
                    aria-label={t('projectActions.sections.edit.title')}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: t('projectActions.sections.delete.title'),
                        text: t('projectActions.sections.delete.text', {
                          name: section.name,
                        }),
                        confirmText: t(
                          'projectActions.sections.delete.confirm',
                        ),
                        confirmVariant: 'danger',
                        onConfirm: () => {
                          if (selectedSectionId === section.id) {
                            onSelect(undefined);
                          }
                          void deleteSection.mutateAsync(section.id);
                        },
                      })
                    }
                    className="rounded p-1 text-text-secondary opacity-0 transition hover:text-danger group-hover:opacity-100"
                    aria-label={t('projectActions.sections.delete.confirm')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => onSelect(UNCATEGORIZED_SECTION_ID)}
          className={itemClass(selectedSectionId === UNCATEGORIZED_SECTION_ID)}
        >
          <Inbox className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">
            {t('projectActions.sections.uncategorized')}
          </span>
        </button>
      </nav>
    </aside>
  );
}
