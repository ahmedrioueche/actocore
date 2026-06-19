import { useUiText } from '../../hooks/use-ui-text';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { LauncherIcon } from './LauncherIcon';
import type { ReactNode } from 'react';

export function ChatHeader({
  launcherIcon,
  onMinimize,
  onNewConversation,
  isNewConversationDisabled,
}: {
  /** Same override as `ActoChatWidget` launcherIcon — wins over `ui.launcher.iconUrl`. */
  launcherIcon?: ReactNode;
  onMinimize?: () => void;
  onNewConversation?: () => void;
  isNewConversationDisabled?: boolean;
}) {
  const ui = useActocoreUiConfig();
  const title = useUiText('headerTitle');
  const subtitle = useUiText('headerSubtitle');
  const newConversationLabel = useUiText('newConversation');
  const minimizeLabel = useUiText('minimize');
  const customImage = Boolean(launcherIcon || ui.launcher?.iconUrl);

  return (
    <header
      className={mergeClassNames('ac-chat__header', ui.classNames?.header)}
    >
      <div
        className={mergeClassNames(
          'ac-chat__header-icon',
          customImage && 'ac-chat__header-icon--image',
          ui.classNames?.headerIcon,
        )}
        aria-hidden
      >
        <LauncherIcon customIcon={launcherIcon} size="header" />
      </div>
      <div className="ac-chat__header-text">
        <h2 className="ac-chat__header-title">{title}</h2>
        <p className="ac-chat__header-subtitle">{subtitle}</p>
      </div>
      <div className="ac-chat__header-actions">
        {onNewConversation ? (
          <button
            type="button"
            className="ac-chat__header-btn"
            onClick={onNewConversation}
            disabled={isNewConversationDisabled}
            aria-label={newConversationLabel}
            title={newConversationLabel}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
        {onMinimize ? (
          <button
            type="button"
            className="ac-chat__header-btn"
            onClick={onMinimize}
            aria-label={minimizeLabel}
            title={minimizeLabel}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                d="M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  );
}
