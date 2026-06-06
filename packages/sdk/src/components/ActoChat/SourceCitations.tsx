import { useTranslation } from 'react-i18next';
import type { QaSourceCitation } from '@ahmedrioueche/actocore-shared';

export function SourceCitations({ sources }: { sources: QaSourceCitation[] }) {
  const { t } = useTranslation();

  if (!sources.length) return null;

  return (
    <div className="ac-chat__sources">
      <div className="ac-chat__sources-title">{t('sources.title')}</div>
      <div className="ac-chat__sources-list">
        {sources.map((c) => (
          <div
            key={`${c.sourceId}-${c.chunkIndex}`}
            className="ac-chat__source-card"
          >
            <div className="ac-chat__source-title">{c.sourceTitle}</div>
            <div className="ac-chat__source-excerpt">{c.excerpt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
