import { ActoChat, ActocoreProvider } from "@ahmedrioueche/actocore-sdk";
import "@ahmedrioueche/actocore-sdk/styles.css";
import { useMemo, type ReactNode } from "react";

import { useTheme } from "@/components/providers/ThemeProvider";
import { routing } from "@/i18n/routing";
import { useT } from "@/i18n/useT";
import {
  getActocoreApiUrl,
  getHeroVisitorId,
  isMarketingChatEnabled,
} from "@/lib/marketing-chat";

import { HeroDemoTerminal } from "./HeroDemoTerminal";

function HeroChatFrame({ children }: { children: ReactNode }) {
  return (
    <div className="hero-chat-frame hero-entrance-visual">
      <div className="hero-chat-shell">{children}</div>
    </div>
  );
}

export function HeroChat() {
  const { t, i18n } = useT("home.hero.chat");
  const { resolvedTheme } = useTheme();
  const visitorId = useMemo(() => getHeroVisitorId(), []);
  const seedMessages = useMemo(
    () => [
      { role: "user" as const, content: t("seedUser") },
      { role: "assistant" as const, content: t("seedAssistant") },
    ],
    [t],
  );

  const locale = i18n.language?.split("-")[0] ?? routing.defaultLocale;
  const rateLimitMessage = t("rateLimitMessage");

  if (!isMarketingChatEnabled()) {
    return (
      <HeroChatFrame>
        <HeroDemoTerminal />
      </HeroChatFrame>
    );
  }

  return (
    <HeroChatFrame>
      <ActocoreProvider
        entryMode="marketing"
        apiKey="public"
        baseURL={getActocoreApiUrl()}
        loadRemoteConfig={false}
        persistSession
        externalUserId={visitorId}
        hostContext={{ currentPage: "marketing-home", route: "/" }}
        i18n={{
          locale,
          translations: {
            [locale]: {
              errors: { TOO_MANY_REQUESTS: rateLimitMessage },
            },
          },
        }}
        theme={{ mode: resolvedTheme }}
        actions={{}}
        security={{ allowedActionNames: [], enforceActionAllowlist: true }}
        voice={{ input: false, output: false }}
        ui={{
          showActionsHint: false,
          showIntentBadge: false,
          seedMessages,
          text: {
            headerTitle: t("headerTitle"),
            headerSubtitle: t("headerSubtitle"),
            emptyTitle: t("emptyTitle"),
            emptyDescription: t("emptyDescription"),
            placeholder: t("placeholder"),
          },
          classNames: { chat: "hero-chat-panel" },
        }}
      >
        <ActoChat className="hero-chat-panel" />
      </ActocoreProvider>
    </HeroChatFrame>
  );
}
