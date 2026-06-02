import { useTranslation } from 'react-i18next';

export function ErrorState({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  const { t } = useTranslation();
  const resolved = message ?? t('errors.generic');

  return (
    <div
      className={className}
      style={{
        padding: 'var(--ac-space-lg)',
        backgroundColor: 'var(--ac-color-danger-surface)',
        border: 'var(--ac-border-width) solid var(--ac-color-danger)',
        borderRadius: 'var(--ac-radius-md)',
        color: 'var(--ac-color-text)',
      }}
      role="alert"
    >
      {resolved}
    </div>
  );
}

