import { ActoChatWidget, ActocoreProvider } from '@ahmedrioueche/actocore-sdk';
import '@ahmedrioueche/actocore-sdk/styles.css';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { createStudioAssistantActions } from '@/lib/studio-assistant-actions';
import { resolveStudioHostContext } from '@/lib/studio-host-context';

const API_URL =
  import.meta.env.VITE_ACTOCORE_API_URL?.replace(/\/$/, '') ||
  'http://localhost:3000';
const API_KEY = import.meta.env.VITE_ACTOCORE_API_KEY?.trim() ?? '';

/**
 * ActoCore product assistant — same SDK integration as a customer site,
 * using a platform-owned project API key (not the tenant's project).
 */
export function StudioAssistant() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { session, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
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
    <div className="actocore-studio-assistant" data-actocore-studio-assistant>
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
        theme={{ mode: theme }}
        ui={{
          showActionsHint: false,
          widget: {
            hideWhenSelector: '[data-modal-open]',
          },
          text: {
            headerTitle: 'ActoCore Assistant',
            headerSubtitle: 'Help using ActoCore Studio',
            emptyTitle: '',
            emptyDescription: 'Ask a question or describe what you want.',
          },
        }}
      >
        <ActoChatWidget externalUserId={session?.user.id} />
      </ActocoreProvider>
    </div>
  );
}
