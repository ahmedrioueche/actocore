import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  appLayoutApi,
  type ImportAppLayoutDto,
  type AppLayoutImportResult,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useImportAppLayout(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      body: ImportAppLayoutDto,
    ): Promise<AppLayoutImportResult> => {
      ensureApiConfigured();
      return parseApiResponse(await appLayoutApi.importLayout(projectId!, body));
    },
    onSuccess: () => {
      if (!projectId) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appPages.list(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appPageLinks.list(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.actions.lists(projectId),
      });
    },
  });
}
