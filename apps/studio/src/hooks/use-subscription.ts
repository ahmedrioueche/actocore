import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  billingApi,
  type AppSubscriptionBillingCycle,
  type CancelSubscriptionDto,
  type CreateSubscriptionCheckoutDto,
  type PaddleCheckoutData,
  type ScheduleDowngradeDto,
  type StartFreeTrialDto,
  type StudioSubscription,
  type UpgradeSubscriptionDto,
} from '@ahmedrioueche/actocore-shared';

import { invalidateSubscriptionQueries } from '@/lib/billing-cache';
import { ensureApiConfigured } from '@/lib/configure-api';
import { parseApiResponse } from '@/lib/parse-api-response';
import { queryKeys } from '@/lib/query-keys';

export function useSubscriptionSummary() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.subscription.summary(),
    queryFn: async () =>
      parseApiResponse(await billingApi.getSubscription()),
  });
}

export function usePlans() {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.subscription.plans(),
    queryFn: async () => parseApiResponse(await billingApi.listPlans()),
  });
}

export function useTrialEligibility(planId: string | null) {
  ensureApiConfigured();
  return useQuery({
    queryKey: queryKeys.subscription.trialEligibility(planId ?? ''),
    queryFn: async () =>
      parseApiResponse(await billingApi.getTrialEligibility(planId!)),
    enabled: Boolean(planId),
  });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: async (body: CreateSubscriptionCheckoutDto) => {
      ensureApiConfigured();
      return parseApiResponse(await billingApi.createCheckout(body));
    },
  });
}

export function useStartTrial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: StartFreeTrialDto) => {
      ensureApiConfigured();
      return parseApiResponse(await billingApi.startFreeTrial(body));
    },
    onSuccess: () => {
      invalidateSubscriptionQueries(queryClient);
    },
  });
}

export function useSubscribeOrTrial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: CreateSubscriptionCheckoutDto & { hasPaidSubscription: boolean },
    ): Promise<
      | { kind: 'trial'; subscription: StudioSubscription }
      | { kind: 'checkout'; checkout: PaddleCheckoutData }
    > => {
      ensureApiConfigured();
      if (!body.hasPaidSubscription) {
        const eligibility = parseApiResponse(
          await billingApi.getTrialEligibility(body.planId),
        );
        if (eligibility.eligible) {
          const subscription = parseApiResponse(
            await billingApi.startFreeTrial({
              planId: body.planId,
              billingCycle: body.billingCycle,
            }),
          );
          invalidateSubscriptionQueries(queryClient);
          return { kind: 'trial', subscription };
        }
      }

      const checkout = parseApiResponse(
        await billingApi.createCheckout({
          planId: body.planId,
          billingCycle: body.billingCycle,
        }),
      );
      return { kind: 'checkout', checkout };
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body?: CancelSubscriptionDto) => {
      ensureApiConfigured();
      return parseApiResponse(await billingApi.cancelSubscription(body));
    },
    onSuccess: () => {
      invalidateSubscriptionQueries(queryClient);
    },
  });
}

export function useReactivateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      ensureApiConfigured();
      return parseApiResponse(await billingApi.reactivateSubscription());
    },
    onSuccess: () => {
      invalidateSubscriptionQueries(queryClient);
    },
  });
}

export function usePreviewUpgrade() {
  return useMutation({
    mutationFn: async (body: UpgradeSubscriptionDto) => {
      ensureApiConfigured();
      return parseApiResponse(await billingApi.previewUpgrade(body));
    },
  });
}

export function useApplyUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpgradeSubscriptionDto) => {
      ensureApiConfigured();
      return parseApiResponse(await billingApi.applyUpgrade(body));
    },
    onSuccess: () => {
      invalidateSubscriptionQueries(queryClient);
    },
  });
}

export function useScheduleDowngrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ScheduleDowngradeDto) => {
      ensureApiConfigured();
      return parseApiResponse(await billingApi.scheduleDowngrade(body));
    },
    onSuccess: () => {
      invalidateSubscriptionQueries(queryClient);
    },
  });
}

export function useCancelPendingChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      ensureApiConfigured();
      return parseApiResponse(await billingApi.cancelPendingChange());
    },
    onSuccess: () => {
      invalidateSubscriptionQueries(queryClient);
    },
  });
}

export function usePollCheckoutTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: string) => {
      ensureApiConfigured();
      const maxAttempts = 30;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const result = parseApiResponse(
          await billingApi.getTransactionStatus(transactionId),
        );
        const normalized = result.status.toLowerCase();
        if (
          normalized === 'completed' ||
          normalized === 'paid' ||
          normalized === 'billed'
        ) {
          invalidateSubscriptionQueries(queryClient);
          return result;
        }
        if (normalized === 'canceled' || normalized === 'failed') {
          throw new Error(result.status);
        }
        await new Promise((resolve) => {
          window.setTimeout(resolve, 2000);
        });
      }
      throw new Error('timeout');
    },
  });
}

export type SubscriptionBillingCycle = AppSubscriptionBillingCycle;
