import { CreditCard } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseModal from '@/components/ui/BaseModal';
import Checkbox from '@/components/ui/Checkbox';
import { getLegalLinks } from '@/constants/legal';
import {
  useApplyUpgrade,
  usePlans,
  useSubscribeOrTrial,
} from '@/hooks/use-subscription';
import { useFeatureModal } from '@/hooks/use-feature-modal';
import { toast } from '@/stores/toast';
import { formatPlanPrice } from '@/utils/format-plan-price';
import { getUnknownApiErrorMessage } from '@/utils/statusMessage';

export default function SubscribeConsentModal() {
  const { t, i18n } = useTranslation();
  const { isOpen, props, closeModal } = useFeatureModal('subscribeConsent');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const plansQuery = usePlans();
  const subscribeOrTrial = useSubscribeOrTrial();
  const applyUpgrade = useApplyUpgrade();

  const planId = props?.planId;
  const billingCycle = props?.billingCycle ?? 'monthly';
  const mode = props?.mode ?? 'subscribe';

  const plan = useMemo(
    () => (plansQuery.data ?? []).find((entry) => entry.planId === planId),
    [planId, plansQuery.data],
  );

  const legalLinks = getLegalLinks(i18n.language);
  const formattedPrice = plan
    ? formatPlanPrice(plan, billingCycle, i18n.language)
    : null;

  useEffect(() => {
    if (isOpen) {
      setTermsAccepted(false);
    }
  }, [isOpen, planId, mode]);

  const isPending = subscribeOrTrial.isPending || applyUpgrade.isPending;

  if (!isOpen || !planId || !plan) {
    return null;
  }

  const cycleLabel = t(`subscription.billingCycle.${billingCycle}`);
  const perLabel = t(`subscription.plans.per.${billingCycle}`);
  const priceLabel = formattedPrice
    ? `${formattedPrice.amount}/${perLabel}`
    : t('subscription.plans.contactUs');

  const handleContinue = async () => {
    if (!termsAccepted) {
      return;
    }

    try {
      if (mode === 'upgrade') {
        const result = await applyUpgrade.mutateAsync({
          planId,
          billingCycle,
        });
        if (result.approvalUrl) {
          window.location.href = result.approvalUrl;
          return;
        }
        toast.success(t('subscription.upgrade.success'));
        closeModal();
        return;
      }

      const checkout = await subscribeOrTrial.mutateAsync({
        planId,
        billingCycle,
      });
      window.location.href = checkout.approval_url;
    } catch (err: unknown) {
      toast.error(getUnknownApiErrorMessage(t, err));
    }
  };

  const handleClose = () => {
    setTermsAccepted(false);
    closeModal();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t(
        mode === 'upgrade'
          ? 'subscription.consent.titleUpgrade'
          : 'subscription.consent.titleSubscribe',
      )}
      subtitle={t('subscription.consent.subtitle')}
      icon={CreditCard}
      maxWidth="max-w-lg"
      primaryButton={{
        label: t(
          mode === 'upgrade'
            ? 'subscription.consent.confirmUpgrade'
            : 'subscription.consent.continueToPayPal',
        ),
        onClick: () => void handleContinue(),
        loading: isPending,
        disabled: !termsAccepted || isPending,
      }}
      secondaryButton={{
        label: t('common.cancel'),
        onClick: handleClose,
        disabled: isPending,
      }}
    >
      <div className="space-y-4 text-sm text-text-secondary">
        <div className="rounded-xl border border-border bg-surface-secondary/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            {t('subscription.consent.summaryLabel')}
          </p>
          <p className="mt-2 text-base font-semibold text-text-primary">
            {plan.name}
          </p>
          <p className="mt-1 text-text-primary">
            {t('subscription.consent.planSummary', {
              price: priceLabel,
              cycle: cycleLabel,
            })}
          </p>
        </div>

        <p>{t('subscription.consent.recurringBody', { price: priceLabel, cycle: cycleLabel })}</p>
        <p>{t('subscription.consent.paymentBody')}</p>
        <p>{t('subscription.consent.cancellationBody')}</p>

        <Checkbox
          id="subscribe-consent-terms"
          variant="inline"
          checked={termsAccepted}
          onChange={setTermsAccepted}
          disabled={isPending}
          aria-label={t('subscription.consent.termsAriaLabel')}
          label={
            <span>
              {t('subscription.consent.termsPrefix')}{' '}
              <a
                href={legalLinks.termsBilling}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t('auth.signup.termsLink')}
              </a>{' '}
              {t('auth.signup.legalAnd')}{' '}
              <a
                href={legalLinks.privacy}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t('auth.signup.privacyLink')}
              </a>
              .
            </span>
          }
        />
      </div>
    </BaseModal>
  );
}
