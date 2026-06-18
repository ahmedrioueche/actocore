import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  isStudioTestAccountEmail,
  productTourApi,
  type StudioProductTourStateData,
  type UpdateStudioProductTourDto,
} from '@ahmedrioueche/actocore-shared';

import { useAuth } from '@/context/AuthContext';
import { hasSeenDemoProductTour, markDemoProductTourSeen } from '@/lib/demo-product-tour';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { ensureApiConfigured } from '@/lib/configure-api';

function isDemoTourSuppressed(
  email: string | undefined,
  hasLease: boolean,
): boolean {
  if (!email || !hasLease || !isStudioTestAccountEmail(email)) {
    return false;
  }
  return hasSeenDemoProductTour(email);
}

export function useProductTourState() {
  ensureApiConfigured();
  const { session } = useAuth();
  const demoEmail = session?.user.email;
  const isDemoSession = Boolean(
    demoEmail &&
      isStudioTestAccountEmail(demoEmail) &&
      session?.testAccountLease,
  );
  const suppressDemoTour = isDemoTourSuppressed(
    demoEmail,
    Boolean(session?.testAccountLease),
  );

  return useQuery({
    queryKey: queryKeys.productTour.state(),
    queryFn: async () =>
      parseApiResponse<StudioProductTourStateData>(
        await productTourApi.getState(),
      ),
    enabled: Boolean(session) && !suppressDemoTour,
    staleTime: 30_000,
  });
}

export function useUpdateProductTour() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const demoEmail = session?.user.email;

  return useMutation({
    mutationFn: async (body: UpdateStudioProductTourDto) => {
      ensureApiConfigured();
      return parseApiResponse<StudioProductTourStateData>(
        await productTourApi.update(body),
      );
    },
    onSuccess: (data) => {
      if (
        demoEmail &&
        isStudioTestAccountEmail(demoEmail) &&
        session?.testAccountLease &&
        (data.dismissed || data.activeStep === null)
      ) {
        markDemoProductTourSeen(demoEmail);
        queryClient.setQueryData(queryKeys.productTour.state(), {
          ...data,
          eligible: false,
          activeStep: null,
        });
        return;
      }
      queryClient.setQueryData(queryKeys.productTour.state(), data);
    },
  });
}
