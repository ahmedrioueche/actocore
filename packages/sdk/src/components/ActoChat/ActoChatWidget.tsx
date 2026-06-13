import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useMobileViewport } from '../../hooks/use-mobile-viewport';
import { useSuppressedWhenSelector } from '../../hooks/use-suppressed-when-selector';
import { useUiText } from '../../hooks/use-ui-text';
import {
  useActocoreContext,
  useActocoreUiConfig,
} from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { ActoChat } from './ActoChat';
import { LauncherIcon } from './LauncherIcon';

export type WidgetPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

const DEFAULT_WIDGET_Z_INDEX = 1000;

export interface ActoChatWidgetProps {
  position?: WidgetPosition;
  offsetX?: string;
  offsetY?: string;
  /** Stacking order — set below host modals if the launcher overlaps them. */
  zIndex?: number;
  /** Hide widget while this CSS selector matches (e.g. `[data-modal-open]`). */
  hideWhenSelector?: string;
  initialOpen?: boolean;
  className?: string;
  /** Custom launcher icon (React node). Overrides `ui.launcher.iconUrl`. */
  launcherIcon?: ReactNode;
  sessionId?: string;
  externalUserId?: string;
  metadata?: Record<string, unknown>;
  loadHistory?: boolean;
  persistSession?: boolean;
}

function getAnchorPositionStyle(
  position: WidgetPosition,
  offsetX: string,
  offsetY: string,
  zIndex: number,
): CSSProperties {
  const base: CSSProperties = {
    position: 'fixed',
    zIndex,
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
  zIndex: zIndexProp,
  hideWhenSelector: hideWhenSelectorProp,
  initialOpen = false,
  className,
  launcherIcon,
  sessionId,
  externalUserId,
  metadata,
  loadHistory,
  persistSession,
}: ActoChatWidgetProps) {
  const { presentationReady } = useActocoreContext();
  const ui = useActocoreUiConfig();
  const position = positionProp ?? ui.widget?.position ?? 'bottom-right';
  const offsetX =
    offsetXProp ?? ui.widget?.offsetX ?? 'var(--ac-widget-offset-x)';
  const offsetY =
    offsetYProp ?? ui.widget?.offsetY ?? 'var(--ac-widget-offset-y)';
  const defaultOpenLabel = useUiText('open');
  const openLabel = ui.launcher?.ariaLabel ?? defaultOpenLabel;
  const isMobile = useMobileViewport();
  const widgetZIndex =
    zIndexProp ?? ui.widget?.zIndex ?? DEFAULT_WIDGET_Z_INDEX;
  const hideWhenSelector =
    hideWhenSelectorProp ?? ui.widget?.hideWhenSelector;
  const suppressed = useSuppressedWhenSelector(hideWhenSelector);
  const [isOpen, setIsOpen] = useState(initialOpen);
  /** Keep chat mounted after first open so conversation state survives close/reopen. */
  const [chatMounted, setChatMounted] = useState(initialOpen);

  useEffect(() => {
    if (isOpen) {
      setChatMounted(true);
    }
  }, [isOpen]);

  /** Defer scroll until the panel is visible (not `display: none`). */
  const [panelVisible, setPanelVisible] = useState(initialOpen);

  useEffect(() => {
    if (!isOpen) {
      setPanelVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => {
      setPanelVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const anchorStyle: CSSProperties =
    isOpen && isMobile
      ? { position: 'fixed', zIndex: widgetZIndex }
      : getAnchorPositionStyle(position, offsetX, offsetY, widgetZIndex);
  const open = () => setIsOpen(true);

  useEffect(() => {
    if (suppressed && isOpen) {
      setIsOpen(false);
    }
  }, [suppressed, isOpen]);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, isMobile]);

  if (suppressed || !presentationReady) {
    return null;
  }

  return (
    <>
      {isOpen ? (
        <div
          className="ac-widget__backdrop"
          style={{ zIndex: widgetZIndex - 2 }}
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      ) : null}

      <div
        style={{
          ...anchorStyle,
          ['--ac-widget-z-index' as string]: String(widgetZIndex),
        }}
        className={mergeClassNames(
          'ac-widget',
          isOpen && isMobile && 'ac-widget--mobile-open',
          className,
        )}
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
            <ActoChat
              launcherIcon={launcherIcon}
              sessionId={sessionId}
              externalUserId={externalUserId}
              metadata={metadata}
              loadHistory={loadHistory}
              persistSession={persistSession}
              isOpen={panelVisible}
              onMinimize={() => setIsOpen(false)}
            />
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
