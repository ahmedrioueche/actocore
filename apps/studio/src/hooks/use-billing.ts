import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useBillingSubscription() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.billing.subscription(),
    queryFn: async () =>
      parseApiResponse(await billingApi.getSubscription()),
  });
}

export function useBillingQuota() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.billing.quota(),
    queryFn: async () => parseApiResponse(await billingApi.getQuota()),
  });
}
