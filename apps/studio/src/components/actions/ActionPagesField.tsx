import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppPages } from '@/hooks/use-app-pages';

interface ActionPagesFieldProps {
  projectId: string | null;
  value: string[];
  onChange: (pageIds: string[]) => void;
  disabled?: boolean;
}

export function ActionPagesField({
  projectId,
  value,
  onChange,
  disabled = false,
}: ActionPagesFieldProps) {
  const { t } = useTranslation();
  const pagesQuery = useAppPages(projectId);
  const pages = pagesQuery.data ?? [];

  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (pageId: string) => {
    if (disabled) {
      return;
    }
    if (selected.has(pageId)) {
      onChange(value.filter((id) => id !== pageId));
      return;
    }
    onChange([...value, pageId]);
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-text-primary">
        {t('projectActions.fields.pages')}
      </span>
      <p className="text-xs text-text-secondary">
        {t('projectActions.fields.pagesHint')}
      </p>
      {pages.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {t('projectActions.fields.pagesEmpty')}
        </p>
      ) : (
        <ul className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {pages.map((page) => (
            <li key={page.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(page.id)}
                  onChange={() => toggle(page.id)}
                  disabled={disabled}
                />
                <span>
                  {page.title}{' '}
                  <span className="font-mono text-xs text-text-secondary">
                    ({page.slug})
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
