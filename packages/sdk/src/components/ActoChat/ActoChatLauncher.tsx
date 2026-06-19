import type { ReactNode } from 'react';
import { useUiText } from '../../hooks/use-ui-text';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { useActoChatWidget } from './ActoChatWidgetContext';
import { LauncherIcon } from './LauncherIcon';

export interface ActoChatLauncherProps {
  className?: string;
  /** Custom icon — overrides `ui.launcher.iconUrl`. */
  launcherIcon?: ReactNode;
}

export function ActoChatLauncher({
  className,
  launcherIcon,
}: ActoChatLauncherProps) {
  const ui = useActocoreUiConfig();
  const { isOpen, open } = useActoChatWidget();
  const defaultOpenLabel = useUiText('open');
  const variant = ui.launcher?.variant ?? 'icon';
  const visibleLabel = ui.launcher?.label?.trim();
  const explicitAria = ui.launcher?.ariaLabel?.trim();
  const openLabel =
    explicitAria ||
    (variant === 'icon' && visibleLabel) ||
    defaultOpenLabel;
  const label = visibleLabel || openLabel;

  if (isOpen) {
    return null;
  }

  return (
    <button
      type="button"
      className={mergeClassNames(
        'ac-launcher',
        variant === 'icon' && 'ac-launcher--icon ac-widget__launcher',
        variant === 'button' && 'ac-launcher--button',
        variant === 'link' && 'ac-launcher--link',
        ui.classNames?.launcher,
        className,
      )}
      onClick={open}
      aria-label={openLabel}
      title={openLabel}
      aria-expanded={false}
    >
      {variant === 'link' ? (
        label
      ) : (
        <>
          <LauncherIcon customIcon={launcherIcon} />
          {variant === 'button' ? (
            <span className="ac-launcher__label">{label}</span>
          ) : null}
        </>
      )}
    </button>
  );
}
