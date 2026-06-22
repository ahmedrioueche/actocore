import type {
  AppSubscriptionBillingCycle,
  StudioPlan,
} from '@ahmedrioueche/actocore-shared';
import { Receipt } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  PlanPicker,
  type PlanActionKind,
} from '@/components/billing/PlanPicker';
import { SubscriptionStatusCard } from '@/components/billing/SubscriptionStatusCard';
import { PageHeader } from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Error from '@/components/ui/Error';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/context/AuthContext';
import {
  useCancelPendingChange,
  useCancelSubscription,
  usePlans,
  usePollPayPalSubscription,
  useReactivateSubscription,
  useSubscriptionSummary,
} from '@/hooks/use-subscription';
import { canWriteBilling } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { scrollToSubscriptionPlans } from '@/utils/scroll';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const openConfirm = useModalStore((state) => state.openConfirm);
  const openModal = useModalStore((state) => state.openModal);
  const search = useSearch({ strict: false }) as {
    subscriptionId?: string;
    scrollTo?: 'plans';
  };
  const checkoutHandled = useRef<string | null>(null);

  const canWrite = canWriteBilling(session);
  const [billingCycle, setBillingCycle] =
    useState<AppSubscriptionBillingCycle>('monthly');

  const summaryQuery = useSubscriptionSummary();
  const plansQuery = usePlans();

  const cancelSubscription = useCancelSubscription();
  const reactivateSubscription = useReactivateSubscription();
  const cancelPendingChange = useCancelPendingChange();
  const pollSubscription = usePollPayPalSubscription();

  const subscription = summaryQuery.data?.subscription;
  const currentPlan = useMemo(() => {
    const plans = plansQuery.data ?? [];
    if (subscription?.plan) {
      return subscription.plan;
    }
    if (subscription?.planId) {
      const match = plans.find((plan) => plan.planId === subscription.planId);
      if (match) {
        return match;
      }
    }
    return plans.find((plan) => plan.level === 'free') ?? null;
  }, [plansQuery.data, subscription?.plan, subscription?.planId]);
  const isError = summaryQuery.isError || plansQuery.isError;
  const isLoading = summaryQuery.isLoading || plansQuery.isLoading;
  const isCheckoutProcessing = pollSubscription.isPending;

  useEffect(() => {
    if (subscription?.billingCycle) {
      setBillingCycle(subscription.billingCycle);
    }
  }, [subscription?.billingCycle]);

  useEffect(() => {
    const subscriptionId = search.subscriptionId;
    if (!subscriptionId || checkoutHandled.current === subscriptionId) {
      return;
    }
    checkoutHandled.current = subscriptionId;

    pollSubscription
      .mutateAsync(subscriptionId)
      .then(() => {
        toast.success(t('subscription.checkout.success'));
        void navigate({
          to: '/subscription',
          search: { subscriptionId: undefined, scrollTo: undefined },
          replace: true,
        });
      })
      .catch(() => {
        toast.error(t('subscription.checkout.failed'));
        void navigate({
          to: '/subscription',
          search: { subscriptionId: undefined, scrollTo: undefined },
          replace: true,
        });
      });
  }, [search.subscriptionId, t, navigate, pollSubscription]);

  useEffect(() => {
    if (search.scrollTo !== 'plans' || isCheckoutProcessing) {
      return;
    }

    const clearScrollSearch = () => {
      void navigate({
        to: '/subscription',
        search: {
          subscriptionId: search.subscriptionId,
          scrollTo: undefined,
        },
        replace: true,
      });
    };

    if (isError) {
      clearScrollSearch();
      return;
    }

    let timeoutId: number | undefined;

    const scroll = () => {
      if (!scrollToSubscriptionPlans()) {
        return false;
      }
      clearScrollSearch();
      return true;
    };

    const frame = requestAnimationFrame(() => {
      if (scroll()) {
        return;
      }
      timeoutId = window.setTimeout(scroll, 150);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    search.scrollTo,
    search.subscriptionId,
    isCheckoutProcessing,
    isError,
    navigate,
    isLoading,
  ]);

  const handleSelectPlan = (plan: StudioPlan, action: PlanActionKind) => {
    if (action === 'upgrade') {
      openModal('subscribeConsent', {
        planId: plan.planId,
        billingCycle,
        mode: 'upgrade',
      });
      return;
    }
    if (action === 'subscribe' || action === 'trial') {
      openModal('subscribeConsent', {
        planId: plan.planId,
        billingCycle,
        mode: 'subscribe',
      });
    }
  };

  const handleCancel = () => {
    const endDate = subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
      : '';

    openConfirm({
      title: t('subscription.cancel.title'),
      text: t('subscription.cancel.confirm', { date: endDate }),
      confirmText: t('subscription.cancel.submit'),
      confirmVariant: 'danger',
      onConfirm: () => {
        void (async () => {
          try {
            await cancelSubscription.mutateAsync(undefined);
            toast.success(t('subscription.cancel.success'));
          } catch (err: unknown) {
            toast.error(getUnknownApiErrorMessage(t, err));
          }
        })();
      },
    });
  };

  const handleReactivate = () => {
    void (async () => {
      try {
        await reactivateSubscription.mutateAsync();
        toast.success(t('subscription.reactivateSuccess'));
      } catch (err: unknown) {
        toast.error(getUnknownApiErrorMessage(t, err));
      }
    })();
  };

  const handleCancelPendingChange = () => {
    void (async () => {
      try {
        await cancelPendingChange.mutateAsync();
        toast.success(t('subscription.pendingUpgrade.cancelled'));
      } catch (err: unknown) {
        toast.error(getUnknownApiErrorMessage(t, err));
      }
    })();
  };

  return (
    <>
      <PageHeader
        title={t('subscription.title')}
        subtitle={t('subscription.subtitle')}
        actions={
          <Button
            variant="outline"
            icon={<Receipt className="h-4 w-4" />}
            onClick={() => navigate({ to: '/billing' })}
          >
            {t('subscription.viewBilling')}
          </Button>
        }
      />

      {isCheckoutProcessing ? (
        <div className="mb-6 flex flex-col items-center gap-3">
          <Loading />
          <p className="text-sm text-text-secondary">
            {t('subscription.checkout.processing')}
          </p>
        </div>
      ) : null}

      {isError ? (
        <Error
          onRetry={() => {
            void summaryQuery.refetch();
            void plansQuery.refetch();
          }}
        />
      ) : (
        <div className="space-y-8">
          <SubscriptionStatusCard
            summary={summaryQuery.data}
            currentPlan={currentPlan}
            isLoading={isLoading}
            canWrite={canWrite}
            onCancel={handleCancel}
            onReactivate={handleReactivate}
            onCancelPendingChange={handleCancelPendingChange}
            isCancelPending={cancelSubscription.isPending}
            isReactivatePending={reactivateSubscription.isPending}
            isCancelChangePending={cancelPendingChange.isPending}
          />

          <PlanPicker
            plans={plansQuery.data}
            subscription={subscription}
            trial={summaryQuery.data?.trial}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            isLoading={isLoading}
            canWrite={canWrite}
            onSelectPlan={handleSelectPlan}
          />
        </div>
      )}
    </>
  );
}
