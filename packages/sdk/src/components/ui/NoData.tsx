import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

export function NoData({
  title,
  description,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={className}
      style={{
        padding: 'var(--ac-space-xl)',
        color: 'var(--ac-color-text-muted)',
      }}
    >
      <div style={{ color: 'var(--ac-color-text)' }}>
        {title ?? t('chat.emptyTitle')}
      </div>
      <div style={{ marginTop: 'var(--ac-space-sm)' }}>
        {description ?? t('chat.emptyDescription')}
      </div>
    </div>
  );
}

