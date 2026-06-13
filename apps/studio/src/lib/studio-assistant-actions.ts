import type { QueryClient } from '@tanstack/react-query';
import { projectsApi } from '@ahmedrioueche/actocore-shared';
import type { TFunction } from 'i18next';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

type ActionHandler = (
  input: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

export type StudioAssistantActionRegistry = Record<string, ActionHandler>;

export function createStudioAssistantActions(deps: {
  navigate: (options: {
    to: '/projects/$projectId';
    params: { projectId: string };
  }) => void | Promise<void>;
  queryClient: QueryClient;
  t: TFunction;
}): StudioAssistantActionRegistry {
  return {
    create_project: async (input) => {
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      if (!name) {
        throw new Error(deps.t('projects.create.nameRequired'));
      }

      ensureApiConfigured();

      try {
        const project = parseApiResponse(
          await projectsApi.create({ name }),
        );

        await deps.queryClient.invalidateQueries({
          queryKey: queryKeys.projects.all(),
        });
        deps.queryClient.setQueryData(
          queryKeys.projects.detail(project.id),
          project,
        );

        const result = { id: project.id, name: project.name };

        // Defer navigation so the action card can show success before route changes remount UI.
        window.setTimeout(() => {
          void deps.navigate({
            to: '/projects/$projectId',
            params: { projectId: project.id },
          });
        }, 0);

        return result;
      } catch (err) {
        throw new Error(getUnknownApiErrorMessage(deps.t, err));
      }
    },
  };
}
