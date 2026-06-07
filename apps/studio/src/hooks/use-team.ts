import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  studioAuthApi,
  type CreateStudioMemberDto,
  type UpdateStudioMemberDto,
} from '@ahmedrioueche/actocore-shared';

import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';
import { invalidateTeamQueries } from '@/lib/team-cache';

export function useTeamMembers() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.team.members(),
    queryFn: async () =>
      parseApiResponse(await studioAuthApi.listMembers({ limit: 100 })).items,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateStudioMemberDto) => {
      ensureApiConfigured();
      return parseApiResponse(await studioAuthApi.createMember(body));
    },
    onSuccess: () => {
      invalidateTeamQueries(queryClient);
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      body,
    }: {
      userId: string;
      body: UpdateStudioMemberDto;
    }) => {
      ensureApiConfigured();
      return parseApiResponse(await studioAuthApi.updateMember(userId, body));
    },
    onSuccess: () => {
      invalidateTeamQueries(queryClient);
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      ensureApiConfigured();
      return parseApiResponse(await studioAuthApi.removeMember(userId));
    },
    onSuccess: () => {
      invalidateTeamQueries(queryClient);
    },
  });
}
