import { useQuery } from '@tanstack/react-query';
import {
  billingApi,
  type PaginationQuery,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useBillingQuota() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.billing.quota(),
    queryFn: async () => parseApiResponse(await billingApi.getQuota()),
  });
}

export function usePaymentHistory(query: PaginationQuery = { page: 1, limit: 20 }) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.billing.payments(query),
    queryFn: async () =>
      parseApiResponse(await billingApi.listPaymentHistory(query)),
  });
}

export function usePayPalManageUrl() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.billing.paypalManageUrl(),
    queryFn: async () => parseApiResponse(await billingApi.getPayPalManageUrl()),
  });
}
