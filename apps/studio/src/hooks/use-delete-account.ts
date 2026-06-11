import { useMutation } from '@tanstack/react-query';
import {
  studioAuthApi,
  type StudioMessageData,
} from '@ahmedrioueche/actocore-shared';

import { forceLogout } from '@/lib/auth-session';
import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';

export function useRequestDeleteAccountOtp() {
  return useMutation({
    mutationFn: async () => {
      ensureApiConfigured();
      const res = await studioAuthApi.requestDeleteAccountOtp();
      return parseApiResponse<StudioMessageData>(res);
    },
  });
}

export function useConfirmDeleteAccount() {
  return useMutation({
    mutationFn: async (otp: string) => {
      ensureApiConfigured();
      const res = await studioAuthApi.confirmDeleteAccount({ otp });
      return parseApiResponse<StudioMessageData>(res);
    },
    onSuccess: async () => {
      await forceLogout('/login');
    },
  });
}
