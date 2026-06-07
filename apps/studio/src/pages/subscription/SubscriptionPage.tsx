import type {
  AppSubscriptionBillingCycle,
  StudioPlan,
} from '@ahmedrioueche/actocore-shared';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  PlanPicker,
  type PlanActionKind,
} from '@/components/billing/PlanPicker';
import { SubscriptionStatusCard } from '@/components/billing/SubscriptionStatusCard';
import { PageHeader } from '@/components/layout/PageHeader';
import Error from '@/components/ui/Error';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/context/AuthContext';
import {
  useApplyUpgrade,
  useCancelPendingChange,
  useCancelSubscription,
  usePlans,
  usePollPayPalSubscription,
  useReactivateSubscription,
  useSubscribeOrTrial,
  useSubscriptionSummary,
} from '@/hooks/use-subscription';
import { canWriteBilling } from '@/lib/studio-permissions';
import { useModalStore } from '@/stores/modal';
import { toast } from '@/stores/toast';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const openConfirm = useModalStore((state) => state.openConfirm);
  const search = useSearch({ strict: false }) as {
    subscriptionId?: string;
  };
  const checkoutHandled = useRef<string | null>(null);

  const canWrite = canWriteBilling(session);
  const [billingCycle, setBillingCycle] =
    useState<AppSubscriptionBillingCycle>('monthly');
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  const summaryQuery = useSubscriptionSummary();
  const plansQuery = usePlans();

  const subscribeOrTrial = useSubscribeOrTrial();
  const cancelSubscription = useCancelSubscription();
  const reactivateSubscription = useReactivateSubscription();
  const applyUpgrade = useApplyUpgrade();
  const cancelPendingChange = useCancelPendingChange();
  const pollSubscription = usePollPayPalSubscription();

  const subscription = summaryQuery.data?.subscription;
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
          search: { subscriptionId: undefined },
          replace: true,
        });
      })
      .catch(() => {
        toast.error(t('subscription.checkout.failed'));
        void navigate({
          to: '/subscription',
          search: { subscriptionId: undefined },
          replace: true,
        });
      });
  }, [search.subscriptionId, t, navigate, pollSubscription]);

  const handleSubscribe = async (plan: StudioPlan) => {
    setPendingPlanId(plan.planId);
    try {
      const checkout = await subscribeOrTrial.mutateAsync({
        planId: plan.planId,
        billingCycle,
      });
      window.location.href = checkout.approval_url;
    } catch (err: unknown) {
      toast.error(getUnknownApiErrorMessage(t, err));
    } finally {
      setPendingPlanId(null);
    }
  };

  const handleUpgrade = (plan: StudioPlan) => {
    openConfirm({
      title: t('subscription.upgrade.title'),
      text: t('subscription.upgrade.confirm', { plan: plan.name }),
      confirmText: t('subscription.upgrade.submit'),
      onConfirm: () => {
        void (async () => {
          setPendingPlanId(plan.planId);
          try {
            const result = await applyUpgrade.mutateAsync({
              planId: plan.planId,
              billingCycle,
            });
            if (result.approvalUrl) {
              window.location.href = result.approvalUrl;
              return;
            }
            toast.success(t('subscription.upgrade.success'));
          } catch (err: unknown) {
            toast.error(getUnknownApiErrorMessage(t, err));
          } finally {
            setPendingPlanId(null);
          }
        })();
      },
    });
  };

  const handleSelectPlan = (plan: StudioPlan, action: PlanActionKind) => {
    if (action === 'upgrade') {
      handleUpgrade(plan);
      return;
    }
    if (action === 'subscribe' || action === 'trial') {
      void handleSubscribe(plan);
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
          <Link
            to="/billing"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {t('subscription.viewBilling')}
          </Link>
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
            pendingPlanId={pendingPlanId}
            onSelectPlan={handleSelectPlan}
          />
        </div>
      )}
    </>
  );
}
