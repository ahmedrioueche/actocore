import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

export function Loading({
  text,
  className,
}: {
  text?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={className}
      style={{
        padding: 'var(--ac-space-lg)',
        color: 'var(--ac-color-text-muted)',
        fontFamily: 'var(--ac-font-family)',
      }}
      role="status"
      aria-live="polite"
    >
      {text ?? t('chat.loading')}
    </div>
  );
}

