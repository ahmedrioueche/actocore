import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  className,
  right,
}: {
  title?: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--ac-space-md) 0',
        borderBottom: 'var(--ac-border-width) solid var(--ac-color-border)',
        fontFamily: 'var(--ac-font-family)',
      }}
    >
      <div style={{ fontSize: 'var(--ac-font-size-lg)', fontWeight: 600 }}>
        {title ?? t('chat.title')}
      </div>
      {right}
    </div>
  );
}

