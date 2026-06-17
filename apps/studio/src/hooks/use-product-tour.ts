import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  productTourApi,
  type StudioProductTourStateData,
  type UpdateStudioProductTourDto,
} from '@ahmedrioueche/actocore-shared';

import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { ensureApiConfigured } from '@/lib/configure-api';

export function useProductTourState() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.productTour.state(),
    queryFn: async () =>
      parseApiResponse<StudioProductTourStateData>(
        await productTourApi.getState(),
      ),
    staleTime: 30_000,
  });
}

export function useUpdateProductTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateStudioProductTourDto) => {
      ensureApiConfigured();
      return parseApiResponse<StudioProductTourStateData>(
        await productTourApi.update(body),
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.productTour.state(), data);
    },
  });
}
