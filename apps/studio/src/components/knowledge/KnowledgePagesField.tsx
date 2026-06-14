import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Checkbox from '@/components/ui/Checkbox';
import { useAppPages } from '@/hooks/use-app-pages';

interface KnowledgePagesFieldProps {
  projectId: string | null;
  value: string[];
  onChange: (pageIds: string[]) => void;
  disabled?: boolean;
}

export function KnowledgePagesField({
  projectId,
  value,
  onChange,
  disabled = false,
}: KnowledgePagesFieldProps) {
  const { t } = useTranslation();
  const pagesQuery = useAppPages(projectId);
  const pages = pagesQuery.data ?? [];

  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (pageId: string, checked: boolean) => {
    if (disabled) {
      return;
    }
    if (!checked) {
      onChange(value.filter((id) => id !== pageId));
      return;
    }
    onChange([...value, pageId]);
  };

  return (
    <div className="space-y-3">
      <div>
        <span className="block text-sm font-medium text-text-primary">
          {t('knowledge.detail.pages')}
        </span>
        <p className="mt-1 text-xs text-text-secondary">
          {t('knowledge.detail.pagesHint')}
        </p>
      </div>
      {pages.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {t('knowledge.detail.pagesEmpty')}
        </p>
      ) : (
        <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pe-1 md:grid-cols-2">
          {pages.map((page) => (
            <Checkbox
              key={page.id}
              id={`knowledge-page-${page.id}`}
              checked={selected.has(page.id)}
              onChange={(checked) => toggle(page.id, checked)}
              label={page.title}
              description={page.slug}
              descriptionClassName="font-mono"
              disabled={disabled}
              className="min-w-0"
            />
          ))}
        </div>
      )}
    </div>
  );
}
