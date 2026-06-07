import type {
  StudioSubscription,
  StudioSubscriptionSummary,
} from "@ahmedrioueche/actocore-shared";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import Tip from "@/components/ui/Tip";

interface SubscriptionStatusCardProps {
  summary: StudioSubscriptionSummary | undefined;
  isLoading: boolean;
  canWrite: boolean;
  onCancel: () => void;
  onReactivate: () => void;
  onCancelPendingChange: () => void;
  isCancelPending: boolean;
  isReactivatePending: boolean;
  isCancelChangePending: boolean;
}

function formatDate(value: string | undefined, locale: string): string | null {
  if (!value) {
    return null;
  }
  return new Date(value).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function resolvePlanName(
  subscription: StudioSubscription | null | undefined,
  freeLabel: string,
): string {
  return subscription?.plan?.name ?? subscription?.planId ?? freeLabel;
}

export function SubscriptionStatusCard({
  summary,
  isLoading,
  canWrite,
  onCancel,
  onReactivate,
  onCancelPendingChange,
  isCancelPending,
  isReactivatePending,
  isCancelChangePending,
}: SubscriptionStatusCardProps) {
  const { t, i18n } = useTranslation();
  const subscription = summary?.subscription;
  const planName = resolvePlanName(subscription, t("subscription.freePlan"));
  const status = subscription?.status ?? "active";

  const renewalDate = formatDate(subscription?.currentPeriodEnd, i18n.language);
  const pendingDate = formatDate(
    subscription?.pendingChangeEffectiveDate,
    i18n.language,
  );

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            {t("subscription.currentPlan")}
          </p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-48 max-w-full" />
          ) : (
            <h2 className="mt-1 text-2xl font-bold text-text-primary">
              {planName}
            </h2>
          )}

          {!isLoading && subscription?.billingCycle ? (
            <p className="mt-2  text-sm text-text-secondary">
              {t(`subscription.billingCycle.${subscription.billingCycle}`)}
            </p>
          ) : null}

          {!isLoading &&
          summary?.trial?.isTrialing &&
          summary.trial.trialEndsAt ? (
            <p className="mt-2 text-sm text-text-secondary">
              {t("subscription.trialEnds", {
                date: formatDate(summary.trial.trialEndsAt, i18n.language),
              })}
            </p>
          ) : !isLoading && renewalDate ? (
            <p className="mt-2 text-sm text-text-secondary">
              {subscription?.cancelAtPeriodEnd
                ? t("subscription.accessUntil", { date: renewalDate })
                : t("subscription.renewsOn", { date: renewalDate })}
            </p>
          ) : isLoading ? (
            <Skeleton className="mt-2 h-4 w-56 max-w-full" />
          ) : null}
        </div>

        {isLoading ? (
          <Skeleton className="h-7 w-20 rounded-full" />
        ) : (
          <StatusBadge status={status} />
        )}
      </div>

      {!isLoading && subscription?.cancelAtPeriodEnd ? (
        <div className="mt-6">
          <Tip
            variant="warning"
            title={t("subscription.cancelScheduled.title")}
          >
            <p>{t("subscription.cancelScheduled.body")}</p>
            {canWrite && subscription.paypalSubscriptionId ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                loading={isReactivatePending}
                onClick={onReactivate}
              >
                {t("subscription.reactivate")}
              </Button>
            ) : null}
          </Tip>
        </div>
      ) : null}

      {!isLoading && subscription?.pendingPlanId ? (
        <div className="mt-6">
          <Tip variant="info" title={t("subscription.pendingUpgrade.title")}>
            <p>
              {t("subscription.pendingUpgrade.body", {
                plan: subscription.pendingPlanId,
                date: pendingDate,
              })}
            </p>
            {canWrite ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                loading={isCancelChangePending}
                onClick={onCancelPendingChange}
              >
                {t("subscription.cancelPendingUpgrade")}
              </Button>
            ) : null}
          </Tip>
        </div>
      ) : null}

      {!isLoading &&
      canWrite &&
      subscription &&
      !subscription.cancelAtPeriodEnd &&
      subscription.plan?.level !== "free" ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            color="danger"
            size="sm"
            loading={isCancelPending}
            onClick={onCancel}
          >
            {t("subscription.cancelButton")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
