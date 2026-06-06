import { useUiText } from '../../hooks/use-ui-text';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { LauncherIcon } from './LauncherIcon';
import type { ReactNode } from 'react';

export function ChatHeader({
  launcherIcon,
}: {
  /** Same override as `ActoChatWidget` launcherIcon — wins over `ui.launcher.iconUrl`. */
  launcherIcon?: ReactNode;
}) {
  const ui = useActocoreUiConfig();
  const title = useUiText('headerTitle');
  const subtitle = useUiText('headerSubtitle');
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
    </header>
  );
}
