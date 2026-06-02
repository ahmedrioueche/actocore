import { useTranslation } from 'react-i18next';

function LoadingCloudIcon() {
  return (
    <svg
      className="ac-chat__loading-cloud"
      width="40"
      height="32"
      viewBox="0 0 28 22"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M8.5 20.5a6.5 6.5 0 0 1-1.2-12.9A8 8 0 0 1 22.2 4.5a5.5 5.5 0 0 1 .3 11h-14Z"
      />
    </svg>
  );
}

export function ChatLoading() {
  const { t } = useTranslation();

  return (
    <div className="ac-chat__loading" role="status" aria-live="polite">
      <LoadingCloudIcon />
      <p className="ac-chat__loading-text">{t('chat.loading')}</p>
    </div>
  );
}
