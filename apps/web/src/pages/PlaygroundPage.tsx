import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KnowledgeSourceData } from '@ahmedrioueche/actocore-shared';
import '@ahmedrioueche/actocore-sdk/styles.css';

import { CtaButton } from '@/components/site/CtaButton';
import { routing } from '@/i18n/routing';
import { useT } from '@/i18n/useT';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
  getPlaygroundChatExternalUserId,
  isMarketingChatEnabled,
} from '@/lib/marketing-chat';
import { studioAuthPath } from '@/lib/site';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';
import { validateSdkConfigForm } from '@/utils/sdk-config-form';

import { INITIAL_DEMO_USERS } from '@/playground/demo-users';
import {
  createPlaygroundApi,
  mapActionToPanel,
  mapAppPageToPanel,
} from '@/playground/playground-api';
import { PlaygroundChatPanel } from '@/playground/PlaygroundChatPanel';
import { buildPlaygroundSdkTranslations } from '@/playground/playground-i18n';
import type { PlaygroundProjectCredentials } from '@/playground/playground-project';
import {
  createDefaultPlaygroundSdkConfig,
  playgroundSdkToPatch,
  sdkProjectConfigToPlayground,
  type PlaygroundSdkConfig,
} from '@/playground/playground-sdk-config';
import { PlaygroundSetupWizard } from '@/playground/PlaygroundSetupWizard';
import { PlaygroundShell } from '@/playground/PlaygroundShell';
import { createPlaygroundActions } from '@/playground/playground-actions';
import type {
  PlaygroundActionDefinition,
  PlaygroundAppPage,
  PlaygroundSdkExtras,
  PlaygroundView,
} from '@/playground/types';

type PlaygroundExperienceProps = {
  credentials: PlaygroundProjectCredentials;
};

function PlaygroundExperience({ credentials }: PlaygroundExperienceProps) {
  const { t, i18n } = useT('playground.chat');
  const { t: tSdk } = useT();
  const chatUserId = useMemo(() => getPlaygroundChatExternalUserId(), []);
  const api = useMemo(() => createPlaygroundApi(credentials), [credentials]);

  const [activeView, setActiveView] = useState<PlaygroundView>('app-layout');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appPages, setAppPages] = useState<PlaygroundAppPage[]>([]);
  const [actions, setActions] = useState<PlaygroundActionDefinition[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeSourceData[]>([]);
  const [sdkConfig, setSdkConfig] = useState<PlaygroundSdkConfig>(() =>
    createDefaultPlaygroundSdkConfig(),
  );
  const [configRevision, setConfigRevision] = useState(0);
  const [users, setUsers] = useState(INITIAL_DEMO_USERS);
  const [hostRoute, setHostRoute] = useState({ currentPage: 'users', route: '/users' });
  const [knowledgeBusy, setKnowledgeBusy] = useState(false);
  const [sdkBusy, setSdkBusy] = useState(false);
  const usersRef = useRef(users);
  usersRef.current = users;
  const sdkConfigRef = useRef(sdkConfig);
  sdkConfigRef.current = sdkConfig;
  const sdkSaveTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (sdkSaveTimer.current) {
        clearTimeout(sdkSaveTimer.current);
      }
    },
    [],
  );

  const locale = i18n.language?.split('-')[0] ?? routing.defaultLocale;
  const rateLimitMessage = t('rateLimitMessage');
  const sdkTranslations = useMemo(
    () => buildPlaygroundSdkTranslations(i18n, rateLimitMessage, locale),
    [i18n, locale, rateLimitMessage],
  );
  const clientActions = useMemo(
    () => createPlaygroundActions(() => usersRef.current, setUsers),
    [],
  );

  const reloadProject = useCallback(async () => {
    const [actionRows, pageRows, knowledgeRows, sdkConfigRow] = await Promise.all([
      api.listActions(),
      api.listAppPages(),
      api.listKnowledge(),
      api.getSdkConfig(),
    ]);

    const nextPages = pageRows.map(mapAppPageToPanel);
    setAppPages(nextPages);
    setActions(actionRows.map(mapActionToPanel));
    setKnowledge(knowledgeRows);
    setSdkConfig(sdkProjectConfigToPlayground(sdkConfigRow));

    setHostRoute((prev) => {
      const stillExists = nextPages.some((page: PlaygroundAppPage) => page.id === prev.currentPage);
      if (stillExists) {
        return prev;
      }
      const first = nextPages[0];
      return first
        ? { currentPage: first.id, route: first.route }
        : { currentPage: 'home', route: '/' };
    });
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void reloadProject()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('loadError'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadProject, t]);

  const persistSdkConfig = useCallback(
    async (next: PlaygroundSdkConfig) => {
      const validationError = validateSdkConfigForm(next.form);
      if (validationError) {
        throw new Error(tSdk(`sdkConfig.errors.${validationError}`));
      }

      const saved = await api.updateSdkConfig(playgroundSdkToPatch(next));
      setSdkConfig(sdkProjectConfigToPlayground(saved));
      setConfigRevision((value) => value + 1);
    },
    [api, tSdk],
  );

  const handleAppPagesChange = useCallback(
    async (nextPages: PlaygroundAppPage[]) => {
      const previous = appPages;
      setAppPages(nextPages);

      try {
        const previousByBackendId = new Map(
          previous.filter((page) => page.backendId).map((page) => [page.backendId!, page]),
        );
        const nextBackendIds = new Set(
          nextPages.map((page) => page.backendId).filter(Boolean) as string[],
        );

        for (const page of previous) {
          if (page.backendId && !nextBackendIds.has(page.backendId)) {
            await api.deleteAppPage(page.backendId);
          }
        }

        const synced: PlaygroundAppPage[] = [];
        for (const page of nextPages) {
          if (page.backendId) {
            const prior = previousByBackendId.get(page.backendId);
            if (
              !prior ||
              prior.title !== page.title ||
              prior.route !== page.route ||
              prior.description !== page.description
            ) {
              const updated = await api.updateAppPage(page.backendId, {
                title: page.title,
                route: page.route,
                description: page.description,
              });
              synced.push(mapAppPageToPanel(updated));
            } else {
              synced.push(page);
            }
            continue;
          }

          const created = await api.createAppPage({
            slug: page.id,
            title: page.title,
            route: page.route,
            description: page.description,
            enabled: true,
          });
          synced.push(mapAppPageToPanel(created));
        }

        setAppPages(synced);
      } catch (err) {
        setAppPages(previous);
        setError(err instanceof Error ? err.message : t('saveError'));
      }
    },
    [api, appPages, t],
  );

  const handleActionsChange = useCallback(
    async (nextActions: PlaygroundActionDefinition[]) => {
      const previous = actions;
      setActions(nextActions);

      try {
        await Promise.all(
          nextActions.map(async (action) => {
            if (!action.id) {
              return;
            }
            const prior = previous.find((item) => item.id === action.id);
            if (
              !prior ||
              (prior.description === action.description &&
                prior.enabled === action.enabled)
            ) {
              return;
            }
            await api.updateAction(action.id, {
              description: action.description,
              enabled: action.enabled,
            });
          }),
        );

        const nextConfig: PlaygroundSdkConfig = {
          ...sdkConfig,
          extras: {
            ...sdkConfig.extras,
            allowedActionNames: nextActions
              .filter((action) => action.enabled)
              .map((action) => action.name),
          },
        };
        await persistSdkConfig(nextConfig);
      } catch (err) {
        setActions(previous);
        setError(err instanceof Error ? err.message : t('saveError'));
      }
    },
    [actions, api, persistSdkConfig, sdkConfig, t],
  );

  const handleSdkFormChange = useCallback(
    (form: SdkConfigFormState) => {
      const next: PlaygroundSdkConfig = { ...sdkConfigRef.current, form };
      setSdkConfig(next);
      sdkConfigRef.current = next;

      if (sdkSaveTimer.current) {
        clearTimeout(sdkSaveTimer.current);
      }

      sdkSaveTimer.current = window.setTimeout(() => {
        void (async () => {
          setSdkBusy(true);
          try {
            await persistSdkConfig(sdkConfigRef.current);
          } catch (err) {
            setError(err instanceof Error ? err.message : t('saveError'));
          } finally {
            setSdkBusy(false);
          }
        })();
      }, 600);
    },
    [persistSdkConfig, t],
  );

  const handleSdkExtrasChange = useCallback(
    async (extras: PlaygroundSdkExtras) => {
      const previous = sdkConfig;
      const next: PlaygroundSdkConfig = { ...sdkConfig, extras };
      setSdkConfig(next);
      setSdkBusy(true);

      try {
        await persistSdkConfig(next);
      } catch (err) {
        setSdkConfig(previous);
        setError(err instanceof Error ? err.message : t('saveError'));
      } finally {
        setSdkBusy(false);
      }
    },
    [persistSdkConfig, sdkConfig, t],
  );

  const handleKnowledgeUpload = useCallback(
    async (file: File) => {
      setKnowledgeBusy(true);
      try {
        await api.uploadKnowledge(file, file.name);
        setKnowledge(await api.listKnowledge());
      } catch (err) {
        setError(err instanceof Error ? err.message : t('saveError'));
      } finally {
        setKnowledgeBusy(false);
      }
    },
    [api, t],
  );

  const handleKnowledgeRemove = useCallback(
    async (sourceId: string) => {
      setKnowledgeBusy(true);
      try {
        await api.deleteKnowledge(sourceId);
        setKnowledge(await api.listKnowledge());
      } catch (err) {
        setError(err instanceof Error ? err.message : t('saveError'));
      } finally {
        setKnowledgeBusy(false);
      }
    },
    [api, t],
  );

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl border border-border p-8 text-center text-sm text-text-secondary">
        {t('loadingProject')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl border border-border p-8 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <PlaygroundShell
      activeView={activeView}
      onViewChange={setActiveView}
      projectName={credentials.projectName}
      users={users}
      knowledge={knowledge}
      knowledgeBusy={knowledgeBusy}
      sdkBusy={sdkBusy}
      onKnowledgeUpload={handleKnowledgeUpload}
      onKnowledgeRemove={handleKnowledgeRemove}
      appPages={appPages}
      onAppPagesChange={(pages) => void handleAppPagesChange(pages)}
      activePageId={hostRoute.currentPage}
      onActivePageChange={(pageId, route) =>
        setHostRoute({ currentPage: pageId, route })
      }
      actions={actions}
      onActionsChange={(next) => void handleActionsChange(next)}
      sdkForm={sdkConfig.form}
      sdkExtras={sdkConfig.extras}
      onSdkFormChange={(form) => void handleSdkFormChange(form)}
      onSdkExtrasChange={(extras) => void handleSdkExtrasChange(extras)}
      chat={
        <PlaygroundChatPanel
          credentials={credentials}
          chatUserId={chatUserId}
          locale={locale}
          sdkTranslations={sdkTranslations}
          clientActions={clientActions}
          hostRoute={hostRoute}
          remoteConfigVersion={configRevision}
        />
      }
    />
  );
}

export function PlaygroundPage() {
  const { t } = useT('playground');
  usePageMeta('playground');
  const [credentials, setCredentials] = useState<PlaygroundProjectCredentials | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import('@/playground/playground-project').then(({ loadPlaygroundProject }) => {
      setCredentials(loadPlaygroundProject());
      setReady(true);
    });
  }, []);

  return (
    <div className="py-10 lg:py-14">
      <div className="site-container">
        <div className="mx-auto mb-8 max-w-3xl text-center lg:mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            {t('eyebrow')}
          </p>
          <h1 className="mb-3 text-3xl font-bold text-text-primary lg:text-4xl">
            {t('title')}
          </h1>
          <p className="mb-6 text-lg text-text-secondary">{t('subtitle')}</p>
          <CtaButton href={studioAuthPath('signup')} className="px-6 py-3">
            {t('signupCta')}
          </CtaButton>
        </div>

        {!isMarketingChatEnabled() ? (
          <div className="glass-panel mx-auto max-w-2xl rounded-2xl border border-border p-6 text-center text-sm text-text-secondary">
            {t('disabled')}
          </div>
        ) : !ready ? null : credentials ? (
          <PlaygroundExperience credentials={credentials} />
        ) : (
          <PlaygroundSetupWizard onComplete={setCredentials} />
        )}
      </div>
    </div>
  );
}
