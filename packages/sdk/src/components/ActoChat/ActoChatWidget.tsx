import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useUiText } from '../../hooks/use-ui-text';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { ActoChat } from './ActoChat';
import { LauncherIcon } from './LauncherIcon';

export type WidgetPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

export interface ActoChatWidgetProps {
  position?: WidgetPosition;
  offsetX?: string;
  offsetY?: string;
  initialOpen?: boolean;
  className?: string;
  /** Custom launcher icon (React node). Overrides `ui.launcher.iconUrl`. */
  launcherIcon?: ReactNode;
}

function getAnchorPositionStyle(
  position: WidgetPosition,
  offsetX: string,
  offsetY: string,
): CSSProperties {
  const base: CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
  };

  switch (position) {
    case 'bottom-left':
      return { ...base, bottom: offsetY, left: offsetX };
    case 'top-right':
      return { ...base, top: offsetY, right: offsetX };
    case 'top-left':
      return { ...base, top: offsetY, left: offsetX };
    case 'bottom-right':
    default:
      return { ...base, bottom: offsetY, right: offsetX };
  }
}

export function ActoChatWidget({
  position: positionProp,
  offsetX: offsetXProp,
  offsetY: offsetYProp,
  initialOpen = false,
  className,
  launcherIcon,
}: ActoChatWidgetProps) {
  const ui = useActocoreUiConfig();
  const position = positionProp ?? ui.widget?.position ?? 'bottom-right';
  const offsetX =
    offsetXProp ?? ui.widget?.offsetX ?? 'var(--ac-widget-offset-x)';
  const offsetY =
    offsetYProp ?? ui.widget?.offsetY ?? 'var(--ac-widget-offset-y)';
  const defaultOpenLabel = useUiText('open');
  const openLabel = ui.launcher?.ariaLabel ?? defaultOpenLabel;
  const [isOpen, setIsOpen] = useState(initialOpen);
  /** Keep chat mounted after first open so conversation state survives close/reopen. */
  const [chatMounted, setChatMounted] = useState(initialOpen);

  useEffect(() => {
    if (isOpen) {
      setChatMounted(true);
    }
  }, [isOpen]);

  const anchorStyle = getAnchorPositionStyle(position, offsetX, offsetY);
  const open = () => setIsOpen(true);

  return (
    <>
      {isOpen ? (
        <div
          className="ac-widget__backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      ) : null}

      <div
        style={anchorStyle}
        className={mergeClassNames('ac-widget', className)}
      >
        {chatMounted ? (
          <div
            className={mergeClassNames(
              'ac-widget__panel',
              !isOpen && 'ac-widget__panel--hidden',
              ui.classNames?.panel,
            )}
            aria-hidden={!isOpen}
          >
            <ActoChat launcherIcon={launcherIcon} />
          </div>
        ) : null}

        {!isOpen ? (
          <button
            type="button"
            className={mergeClassNames(
              'ac-widget__launcher',
              ui.classNames?.launcher,
            )}
            onClick={open}
            aria-label={openLabel}
            title={openLabel}
            aria-expanded={false}
          >
            <LauncherIcon customIcon={launcherIcon} />
          </button>
        ) : null}
      </div>
    </>
  );
}
