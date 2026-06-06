import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  accountApi,
  type UpdateStudioAccountDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useAccountSettings() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.account.settings(),
    queryFn: async () => parseApiResponse(await accountApi.getAccount()),
  });
}

export function useUpdateAccountSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateStudioAccountDto) => {
      ensureApiConfigured();
      return parseApiResponse(await accountApi.updateAccount(body));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.account.settings(), data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}
