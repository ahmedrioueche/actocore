import { Trash2, UploadCloud } from 'lucide-react';
import { useRef } from 'react';

import type { KnowledgeSourceData } from '@ahmedrioueche/actocore-shared';

import { useT } from '@/i18n/useT';

const MAX_UPLOADS = 2;

type KnowledgePanelProps = {
  sources: KnowledgeSourceData[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (sourceId: string) => Promise<void>;
  busy?: boolean;
};

export function KnowledgePanel({
  sources,
  onUpload,
  onRemove,
  busy = false,
}: KnowledgePanelProps) {
  const { t } = useT('playground.knowledge');
  const inputRef = useRef<HTMLInputElement>(null);
  const slotsRemaining = MAX_UPLOADS - sources.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || slotsRemaining <= 0 || busy) {
      return;
    }

    for (const file of Array.from(fileList)) {
      if (sources.length >= MAX_UPLOADS) break;
      await onUpload(file);
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <section className="glass-panel rounded-2xl border border-border p-5">
      <h2 className="mb-1 text-lg font-semibold text-text-primary">{t('uploadTitle')}</h2>
      <p className="mb-4 text-sm text-text-secondary">{t('uploadDescription')}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: MAX_UPLOADS }).map((_, index) => {
          const source = sources[index];
          return (
            <div
              key={source?.id ?? `slot-${index}`}
              className="min-h-[5.5rem] flex-1 basis-[14rem] rounded-xl border border-dashed border-border bg-surface-secondary/40 px-4 py-3"
            >
              {source ? (
                <div className="flex h-full items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {source.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {t('sourceMeta', {
                        status: source.status,
                        chunks: source.chunkCount,
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onRemove(source.id)}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40"
                    aria-label={t('removeFile')}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted">{t('emptySlot', { index: index + 1 })}</p>
              )}
            </div>
          );
        })}
      </div>

      <label
        className={
          slotsRemaining > 0 && !busy
            ? 'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover'
            : 'inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-muted opacity-70'
        }
      >
        <UploadCloud className="h-4 w-4" aria-hidden />
        {slotsRemaining > 0 ? t('uploadButton') : t('uploadFull')}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          multiple={slotsRemaining > 1}
          disabled={slotsRemaining <= 0 || busy}
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </label>
      <p className="mt-3 text-xs text-muted">{t('uploadHint')}</p>
    </section>
  );
}
