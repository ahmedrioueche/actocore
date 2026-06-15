import { Plus, Trash2 } from 'lucide-react';

import { InputField, TextArea } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { cn } from '@/lib/utils';

import { createEmptyAppPage, slugifyPageId } from '../playground-state';
import type { PlaygroundAppPage } from '../types';

type AppLayoutPanelProps = {
  pages: PlaygroundAppPage[];
  activePageId: string;
  onPagesChange: (pages: PlaygroundAppPage[]) => void;
  onActivePageChange: (pageId: string, route: string) => void;
};

export function AppLayoutPanel({
  pages,
  activePageId,
  onPagesChange,
  onActivePageChange,
}: AppLayoutPanelProps) {
  const { t } = useT('playground.appLayout');

  function updatePage(index: number, patch: Partial<PlaygroundAppPage>) {
    const next = pages.map((page, i) => (i === index ? { ...page, ...patch } : page));
    onPagesChange(next);
  }

  function addPage() {
    const page = createEmptyAppPage(pages.length + 1);
    onPagesChange([...pages, page]);
  }

  function removePage(index: number) {
    if (pages.length <= 1) return;
    const removed = pages[index];
    const next = pages.filter((_, i) => i !== index);
    onPagesChange(next);
    if (removed.id === activePageId && next[0]) {
      onActivePageChange(next[0].id, next[0].route);
    }
  }

  return (
    <section className="glass-panel rounded-2xl border border-border p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-lg font-semibold text-text-primary">{t('title')}</h2>
          <p className="text-sm text-text-secondary">{t('description')}</p>
        </div>
        <button
          type="button"
          onClick={addPage}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('addPage')}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <button
              key={page.id}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary-muted text-primary'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary',
              )}
              onClick={() => onActivePageChange(page.id, page.route)}
            >
              {page.title || page.id}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {pages.map((page, index) => (
          <div
            key={`${page.id}-${index}`}
            className={cn(
              'rounded-xl border p-4',
              page.id === activePageId
                ? 'border-primary bg-primary-muted/30'
                : 'border-border bg-surface-secondary/40',
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-text-primary">
                {t('pageLabel', { index: index + 1 })}
              </p>
              <button
                type="button"
                disabled={pages.length <= 1}
                onClick={() => removePage(index)}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40"
                aria-label={t('removePage')}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InputField
                id={`page-title-${index}`}
                label={t('fields.title')}
                value={page.title}
                onChange={(event) => updatePage(index, { title: event.target.value })}
              />
              <InputField
                id={`page-id-${index}`}
                label={t('fields.id')}
                value={page.id}
                className="font-mono text-sm"
                onChange={(event) =>
                  updatePage(index, {
                    id: slugifyPageId(event.target.value) || page.id,
                  })
                }
              />
              <div className="sm:col-span-2">
                <InputField
                  id={`page-route-${index}`}
                  label={t('fields.route')}
                  value={page.route}
                  className="font-mono text-sm"
                  onChange={(event) => updatePage(index, { route: event.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <TextArea
                  id={`page-description-${index}`}
                  label={t('fields.description')}
                  rows={2}
                  value={page.description ?? ''}
                  onChange={(event) =>
                    updatePage(index, { description: event.target.value })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">{t('localHint')}</p>
    </section>
  );
}
