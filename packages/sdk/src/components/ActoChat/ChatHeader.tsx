import { useUiText } from '../../hooks/use-ui-text';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { DefaultLauncherIcon } from './DefaultLauncherIcon';

export function ChatHeader() {
  const ui = useActocoreUiConfig();
  const title = useUiText('headerTitle');
  const subtitle = useUiText('headerSubtitle');

  return (
    <header
      className={mergeClassNames('ac-chat__header', ui.classNames?.header)}
    >
      <div
        className={mergeClassNames(
          'ac-chat__header-icon',
          ui.classNames?.headerIcon,
        )}
        aria-hidden
      >
        <DefaultLauncherIcon />
      </div>
      <div className="ac-chat__header-text">
        <h2 className="ac-chat__header-title">{title}</h2>
        <p className="ac-chat__header-subtitle">{subtitle}</p>
      </div>
    </header>
  );
}
