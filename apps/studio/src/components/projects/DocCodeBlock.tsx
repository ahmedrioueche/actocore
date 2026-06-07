import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DocCodeBlockProps {
  code: string;
  label?: string;
}

export function DocCodeBlock({ code, label }: DocCodeBlockProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </p>
      ) : null}
      <div className="flex items-stretch gap-2">
        <pre className="block min-w-0 flex-1 overflow-x-auto rounded-xl border border-border bg-surface-secondary px-4 py-3 font-mono text-xs text-text-primary whitespace-pre-wrap">
          {code}
        </pre>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="flex shrink-0 items-center justify-center rounded-xl border border-border px-3 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          title={
            copied
              ? t('projectDocs.copied')
              : t('projectDocs.copyCode')
          }
          aria-label={
            copied
              ? t('projectDocs.copied')
              : t('projectDocs.copyCode')
          }
        >
          {copied ? (
            <Check className="h-5 w-5 text-success" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
