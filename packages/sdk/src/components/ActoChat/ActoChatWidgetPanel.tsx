import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useMobileViewport } from '../../hooks/use-mobile-viewport';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { mergeClassNames } from '../../utils/merge-class-names';
import { ActoChat } from './ActoChat';
import { ActoChatLauncher } from './ActoChatLauncher';
import { useActoChatWidget } from './ActoChatWidgetContext';

const DEFAULT_WIDGET_Z_INDEX = 1000;

export type WidgetPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

export interface ActoChatWidgetPanelProps {
  position?: WidgetPosition;
  offsetX?: string;
  offsetY?: string;
  zIndex?: number;
  className?: string;
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

export function ActoChatWidgetPanel({
  position: positionProp,
  offsetX: offsetXProp,
  offsetY: offsetYProp,
  zIndex: zIndexProp,
  className,
  launcherIcon,
  sessionId,
  externalUserId,
  metadata,
  loadHistory,
  persistSession,
}: ActoChatWidgetPanelProps) {
  const ui = useActocoreUiConfig();
  const {
    isOpen,
    close,
    chatMounted,
    panelVisible,
    placement,
  } = useActoChatWidget();
  const isMobile = useMobileViewport();
  const position = positionProp ?? ui.widget?.position ?? 'bottom-right';
  const offsetX =
    offsetXProp ?? ui.widget?.offsetX ?? 'var(--ac-widget-offset-x)';
  const offsetY =
    offsetYProp ?? ui.widget?.offsetY ?? 'var(--ac-widget-offset-y)';
  const widgetZIndex =
    zIndexProp ?? ui.widget?.zIndex ?? DEFAULT_WIDGET_Z_INDEX;
  const panelLayout = ui.widget?.panelLayout ?? 'overlay';
  const isDockLayout =
    panelLayout === 'dock-right' || panelLayout === 'dock-left';
  const useDockLayout = isDockLayout && !(isOpen && isMobile);
  const showFloatingLauncher = placement === 'floating';

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, isMobile]);

  if (placement === 'host' && !isOpen) {
    return null;
  }

  const anchorStyle: CSSProperties =
    isOpen && isMobile
      ? { position: 'fixed', zIndex: widgetZIndex }
      : isOpen && useDockLayout
        ? { position: 'fixed', zIndex: widgetZIndex }
        : getAnchorPositionStyle(position, offsetX, offsetY, widgetZIndex);

  return (
    <>
      {isOpen ? (
        <div
          className="ac-widget__backdrop"
          style={{ zIndex: widgetZIndex - 2 }}
          onClick={close}
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
          isOpen && useDockLayout && panelLayout === 'dock-right' && 'ac-widget--dock-right-open',
          isOpen && useDockLayout && panelLayout === 'dock-left' && 'ac-widget--dock-left-open',
          className,
        )}
      >
        {chatMounted ? (
          <div
            className={mergeClassNames(
              'ac-widget__panel',
              !isOpen && 'ac-widget__panel--hidden',
              useDockLayout && panelLayout === 'dock-right' && 'ac-widget__panel--dock-right',
              useDockLayout && panelLayout === 'dock-left' && 'ac-widget__panel--dock-left',
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
              onMinimize={close}
            />
          </div>
        ) : null}

        {!isOpen && showFloatingLauncher ? (
          <ActoChatLauncher launcherIcon={launcherIcon} />
        ) : null}
      </div>
    </>
  );
}
