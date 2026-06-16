import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  platformApi,
  platformUsageAdminApi,
  plansAdminApi,
  type UpdateStudioReportStatusDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';

export function usePlatformAccounts(
  search = '',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.accounts({ search, page, limit }),
    queryFn: async () =>
      parseApiResponse(await platformApi.listAccounts({ search, page, limit })),
  });
}

export function usePlatformPlans(
  includeInactive = true,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.plans({ includeInactive, page, limit }),
    queryFn: async () =>
      parseApiResponse(
        await plansAdminApi.list(includeInactive, { page, limit }),
      ),
  });
}

export function usePlatformSubscriptions(
  search = '',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.subscriptions({ search, page, limit }),
    queryFn: async () =>
      parseApiResponse(
        await platformApi.listSubscriptions({ search, page, limit }),
      ),
  });
}

export function usePlatformUsers(
  search = '',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.users({ search, page, limit }),
    queryFn: async () =>
      parseApiResponse(await platformApi.listUsers({ search, page, limit })),
  });
}

export function usePlatformProjects(
  search = '',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.projects({ search, page, limit }),
    queryFn: async () =>
      parseApiResponse(await platformApi.listProjects({ search, page, limit })),
  });
}

export function usePlatformAnalytics() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.analytics(),
    queryFn: async () => parseApiResponse(await platformApi.getAnalyticsOverview()),
  });
}

export function usePlatformUsageOverview(from?: string, to?: string) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.usage({ from, to }),
    queryFn: async () =>
      parseApiResponse(
        await platformUsageAdminApi.getOverview(
          from || to ? { from, to } : undefined,
        ),
      ),
    enabled: Boolean(from && to),
  });
}

export function usePlatformAccountSubscription(accountId: string) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.accountSubscription(accountId),
    queryFn: async () =>
      parseApiResponse(await platformApi.getAccountSubscription(accountId)),
    enabled: Boolean(accountId),
  });
}

export function usePlatformReports(
  search = '',
  status = '',
  type = '',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.reports({ search, status, type, page, limit }),
    queryFn: async () =>
      parseApiResponse(
        await platformApi.listReports({ search, status, type, page, limit }),
      ),
  });
}

export function usePlatformReport(reportId: string | undefined) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.platform.report(reportId ?? ''),
    queryFn: async () => parseApiResponse(await platformApi.getReport(reportId!)),
    enabled: Boolean(reportId),
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      body,
    }: {
      reportId: string;
      body: UpdateStudioReportStatusDto;
    }) => {
      ensureApiConfigured();
      return parseApiResponse(await platformApi.updateReportStatus(reportId, body));
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'reports'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.platform.report(variables.reportId),
      });
    },
  });
}
