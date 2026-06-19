import {
  ActoChat,
  ActoChatLauncher,
  ActoChatWidgetProvider,
  ActocoreProvider,
  useActoChatWidget,
  useActocoreConfig,
} from '@ahmedrioueche/actocore-sdk';
import '@ahmedrioueche/actocore-sdk/styles.css';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { GripVertical } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useResizablePanelWidth } from '@/hooks/use-resizable-panel-width';
import { createStudioAssistantActions } from '@/lib/studio-assistant-actions';
import { resolveStudioHostContext } from '@/lib/studio-host-context';
import { useModalStore } from '@/stores/modal';
import { cn } from '@/utils/helper';

const API_URL =
  import.meta.env.VITE_ACTOCORE_API_URL?.replace(/\/$/, '') ||
  'http://localhost:3000';
const API_KEY = import.meta.env.VITE_ACTOCORE_API_KEY?.trim() ?? '';

const ASSISTANT_PANEL_WIDTH_KEY = 'studio.assistant.panelWidth';

interface StudioAssistantEmbedProps {
  externalUserId?: string;
  suppressed: boolean;
}

function studioLauncherPositionClass(
  position: string | undefined,
): string {
  switch (position) {
    case 'bottom-left':
      return 'bottom-5 start-5';
    case 'top-right':
      return 'top-5 end-5';
    case 'top-left':
      return 'top-5 start-5';
    case 'bottom-right':
    default:
      return 'bottom-5 end-5';
  }
}

function StudioAssistantLauncher() {
  const ui = useActocoreConfig().ui;
  const { isOpen } = useActoChatWidget();
  const placement = ui.launcher?.placement ?? 'floating';

  if (isOpen || placement === 'host') {
    return null;
  }

  return (
    <div
      className={cn(
        'pointer-events-auto fixed z-20',
        studioLauncherPositionClass(ui.widget?.position),
      )}
    >
      <ActoChatLauncher />
    </div>
  );
}

function StudioAssistantPanel({
  externalUserId,
}: {
  externalUserId?: string;
}) {
  const { t } = useTranslation();
  const { isOpen, close, chatMounted, panelVisible } = useActoChatWidget();
  const { width, isResizing, onResizePointerDown } = useResizablePanelWidth(
    ASSISTANT_PANEL_WIDTH_KEY,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) {
      return;
    }
    const scroller = document.getElementById('studio-content-scroller');
    const prev = scroller?.style.overflow;
    if (scroller) {
      scroller.style.overflow = 'hidden';
    }
    return () => {
      if (scroller) {
        scroller.style.overflow = prev ?? '';
      }
    };
  }, [isOpen]);

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="pointer-events-auto absolute inset-0 bg-black/20 backdrop-blur-sm md:hidden"
          aria-label={t('common.close')}
          onClick={close}
        />
      ) : null}

      {isOpen ? (
        <aside
          style={{ width: `${width}px` }}
          className={cn(
            'studio-assistant-embed pointer-events-auto absolute z-10 flex flex-col bg-surface shadow-lg',
            'max-md:inset-x-0 max-md:bottom-0 max-md:w-full max-md:max-w-none',
            'max-md:h-[min(40rem,calc(100dvh-5rem))] max-md:rounded-t-2xl max-md:border-t max-md:border-border',
            'md:end-0 md:top-0 md:bottom-0 md:border-s md:border-border',
            isResizing && 'md:transition-none',
          )}
          aria-hidden={!isOpen}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t('assistant.resizePanel')}
            title={t('assistant.resizePanel')}
            onPointerDown={onResizePointerDown}
            className={cn(
              'group absolute start-0 top-0 z-10 hidden h-full w-2 -translate-x-1/2 cursor-col-resize touch-none md:flex md:items-center md:justify-center',
              'hover:bg-primary/10',
              isResizing && 'bg-primary/15',
            )}
          >
            <GripVertical
              className="h-4 w-4 text-text-secondary opacity-50 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
          </div>

          {chatMounted ? (
            <ActoChat
              externalUserId={externalUserId}
              onMinimize={close}
              isOpen={panelVisible}
              className="studio-assistant-embed__chat h-full max-w-none rounded-none border-0 shadow-none max-md:rounded-t-2xl"
            />
          ) : null}
        </aside>
      ) : null}

      <StudioAssistantLauncher />
    </>
  );
}

function StudioAssistantEmbed({
  externalUserId,
  suppressed,
}: StudioAssistantEmbedProps) {
  if (suppressed) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 overflow-visible"
      data-actocore-studio-assistant
    >
      <ActoChatWidgetProvider>
        <StudioAssistantPanel externalUserId={externalUserId} />
      </ActoChatWidgetProvider>
    </div>
  );
}

/**
 * ActoCore product assistant — overlay chat panel over page content only
 * (sidebar and top header stay visible and interactive).
 */
export function StudioAssistant() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { session, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const modalOpen = useModalStore((state) => !!state.currentModal);
  const hostContext = useMemo(
    () => resolveStudioHostContext(pathname),
    [pathname],
  );
  const actions = useMemo(
    () => createStudioAssistantActions({ navigate, queryClient, t }),
    [navigate, queryClient, t],
  );

  if (!API_KEY) {
    if (import.meta.env.DEV) {
      console.info(
        '[ActoCore Studio] Assistant hidden: set VITE_ACTOCORE_API_KEY in apps/studio/.env (npm run setup:assistant), then restart Vite.',
      );
    }
    return null;
  }

  if (isAuthLoading) {
    return null;
  }

  return (
    <ActocoreProvider
      apiKey={API_KEY}
      baseURL={API_URL}
      loadRemoteConfig
      persistSession
      externalUserId={session?.user.id}
      hostContext={hostContext}
      actions={actions}
      security={{ allowedActionNames: ['create_project'] }}
      i18n={{ locale: i18n.language }}
      theme={{ mode: theme, className: 'contents' }}
      ui={{
        presentation: 'inline',
        inline: {
          maxWidth: '100%',
          height: '100%',
          minHeight: '100%',
        },
        showActionsHint: false,
      }}
    >
      <StudioAssistantEmbed
        externalUserId={session?.user.id}
        suppressed={modalOpen}
      />
    </ActocoreProvider>
  );
}
