import type { KnowledgeSourceData } from '@ahmedrioueche/actocore-shared';
import { ChevronRight, FileText, Globe, Map, Type } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TYPE_ICONS = {
  document: FileText,
  url: Globe,
  text: Type,
  sitemap: Map,
} as const;

interface KnowledgeSourceRowContentProps {
  source: KnowledgeSourceData;
  showAction?: boolean;
}

export function KnowledgeSourceRowContent({
  source,
  showAction = true,
}: KnowledgeSourceRowContentProps) {
  const { t } = useTranslation();
  const Icon = TYPE_ICONS[source.type] ?? FileText;
  const subtitle =
    source.file?.originalFilename ??
    source.url ??
    t(`knowledge.types.${source.type}`);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-hover text-text-secondary transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text-primary">{source.title}</p>
        <p className="truncate text-xs text-text-secondary">{subtitle}</p>
      </div>
      {showAction ? (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-text-secondary transition-colors group-hover:text-primary">
          <span className="hidden sm:inline">{t('knowledge.viewDetailsShort')}</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
    </div>
  );
}

export function knowledgeSourceDetailLabel(
  t: (key: string, options?: { name: string }) => string,
  source: KnowledgeSourceData,
): string {
  return t('knowledge.viewDetails', { name: source.title });
}
