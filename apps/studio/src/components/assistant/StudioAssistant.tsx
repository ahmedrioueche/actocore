import { ActoChatWidget, ActocoreProvider } from '@ahmedrioueche/actocore-sdk';
import '@ahmedrioueche/actocore-sdk/styles.css';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const API_URL =
  import.meta.env.VITE_ACTOCORE_API_URL?.replace(/\/$/, '') ||
  'http://localhost:3000';
const API_KEY = import.meta.env.VITE_ACTOCORE_API_KEY?.trim() ?? '';

/**
 * ActoCore product assistant — same SDK integration as a customer site,
 * using a platform-owned project API key (not the tenant's project).
 */
export function StudioAssistant() {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const { session, isLoading: isAuthLoading } = useAuth();

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
        i18n={{ locale: i18n.language }}
        theme={{ mode: theme }}
        ui={{
          showActionsHint: false,
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
