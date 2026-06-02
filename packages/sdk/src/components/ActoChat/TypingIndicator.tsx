import { useTranslation } from 'react-i18next';

function ThinkingCloudIcon() {
  return (
    <svg
      className="ac-chat__typing-cloud"
      width="28"
      height="22"
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

export function TypingIndicator() {
  const { t } = useTranslation();
  const label = t('chat.thinking');

  return (
    <div className="ac-chat__row ac-chat__row--assistant" role="status" aria-live="polite">
      <div className="ac-chat__bubble ac-chat__bubble--assistant ac-chat__typing">
        <ThinkingCloudIcon />
        <span className="ac-chat__typing-dots" aria-hidden>
          <span className="ac-chat__typing-dot" />
          <span className="ac-chat__typing-dot" />
          <span className="ac-chat__typing-dot" />
        </span>
        <span className="ac-chat__typing-label">{label}</span>
      </div>
    </div>
  );
}
