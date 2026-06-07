import type { QueryClient } from '@tanstack/react-query';

import { invalidateSubscriptionQueries } from '@/lib/billing-cache';
import { queryKeys } from '@/lib/query-keys';

export function invalidateTeamQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.team.members(),
  });
  invalidateSubscriptionQueries(queryClient);
}
