import { useTranslation } from 'react-i18next';
import type { QaSourceCitation } from '@ahmedrioueche/actocore-shared';

export function SourceCitations({ sources }: { sources: QaSourceCitation[] }) {
  const { t } = useTranslation();

  if (!sources.length) return null;

  return (
    <div style={{ marginTop: 'var(--ac-space-md)' }}>
      <div
        style={{
          fontSize: 'var(--ac-font-size-sm)',
          color: 'var(--ac-color-text-muted)',
          fontWeight: 600,
        }}
      >
        {t('sources.title')}
      </div>
      <div
        style={{
          marginTop: 'var(--ac-space-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ac-space-sm)',
        }}
      >
        {sources.map((c) => {
          const scoreLabel = t('sources.score', { score: c.score.toFixed(2) });
          return (
            <div
              key={`${c.sourceId}-${c.chunkIndex}`}
              style={{
                border: 'var(--ac-border-width) solid var(--ac-color-border)',
                borderRadius: 'var(--ac-radius-md)',
                padding: 'var(--ac-space-sm)',
                backgroundColor: 'var(--ac-color-surface)',
              }}
            >
              <div style={{ fontWeight: 600 }}>{c.sourceTitle}</div>
              <div
                style={{
                  marginTop: 'var(--ac-space-xs)',
                  fontSize: 'var(--ac-font-size-sm)',
                  color: 'var(--ac-color-text-muted)',
                }}
              >
                {scoreLabel}
              </div>
              <div
                style={{
                  marginTop: 'var(--ac-space-sm)',
                  color: 'var(--ac-color-text)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {c.excerpt}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

