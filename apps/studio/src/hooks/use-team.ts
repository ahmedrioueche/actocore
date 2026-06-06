import { useQuery } from '@tanstack/react-query';
import { studioAuthApi } from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useTeamMembers() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.team.members(),
    queryFn: async () => parseApiResponse(await studioAuthApi.listMembers()),
  });
}
