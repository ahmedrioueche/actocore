import type {
  StudioPlan,
  StudioSubscription,
  StudioSubscriptionSummary,
} from "@ahmedrioueche/actocore-shared";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import Tip from "@/components/ui/Tip";
import { buildPlanBullets } from "@/utils/plan-bullets";

interface SubscriptionStatusCardProps {
  summary: StudioSubscriptionSummary | undefined;
  currentPlan?: StudioPlan | null;
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
  currentPlan,
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
  const planName =
    currentPlan?.name ??
    resolvePlanName(subscription, t("subscription.freePlan"));
  const status = subscription?.status ?? "active";
  const planBullets = currentPlan ? buildPlanBullets(currentPlan, t) : [];

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

      {isLoading ? (
        <div className="mt-6 space-y-2 border-t border-border pt-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      ) : planBullets.length > 0 ? (
        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm font-semibold text-text-primary">
            {t("subscription.planIncludes")}
          </p>
          <ul className="mt-3 space-y-2">
            {planBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2 text-sm text-text-secondary"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
