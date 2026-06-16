import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  reportsApi,
  type CreateStudioReportDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';

export function useReports(page = 1, limit = DEFAULT_PAGE_SIZE) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.reports.list({ page, limit }),
    queryFn: async () =>
      parseApiResponse(await reportsApi.listMyReports({ page, limit })),
  });
}

export function useReport(reportId: string | undefined) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.reports.detail(reportId ?? ''),
    queryFn: async () =>
      parseApiResponse(await reportsApi.getMyReport(reportId!)),
    enabled: Boolean(reportId),
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateStudioReportDto) => {
      ensureApiConfigured();
      return parseApiResponse(await reportsApi.createReport(body));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all() });
    },
  });
}
