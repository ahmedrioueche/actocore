import { useState } from 'react';

import {
  BillingCycleToggle,
  PricingPlansDeck,
} from '@/components/pricing/PricingPlansDeck';
import { PageHero } from '@/components/site/PageHero';
import { LocaleLink } from '@/i18n/LocaleLink';
import { useT } from '@/i18n/useT';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { usePageMeta } from '@/hooks/usePageMeta';
import type { SignupBillingCycle } from '@/lib/site';

const FAQ_KEYS = ['billing', 'trial', 'tokens', 'upgrade', 'enterprise'] as const;

export function PricingPage() {
  const { t } = useT('pricing');
  usePageMeta('pricing');
  const [cycle, setCycle] = useState<SignupBillingCycle>('monthly');
  const { plans, isLoading, error } = usePricingPlans();

  return (
    <div className="site-container py-16 sm:py-20">
      <PageHero title={t('title')} subtitle={t('subtitle')}>
        <BillingCycleToggle cycle={cycle} onChange={setCycle} className="mt-8" />
      </PageHero>

      <PricingPlansDeck
        plans={plans}
        isLoading={isLoading}
        error={error}
        cycle={cycle}
        className="mt-14"
      />

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-bold text-text-primary">{t('faqTitle')}</h2>
        <div className="space-y-3">
          {FAQ_KEYS.map((key) => (
            <details
              key={key}
              className="group rounded-xl border border-border bg-surface px-5 py-4 open:border-primary"
            >
              <summary className="cursor-pointer list-none font-semibold text-text-primary marker:content-none [&::-webkit-details-marker]:hidden">
                {t(`faq.${key}.question`)}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {t(`faq.${key}.answer`)}
                {key === 'enterprise' ? (
                  <>
                    {' '}
                    <LocaleLink href="/contact" className="font-medium text-primary hover:underline">
                      {t('contact')}
                    </LocaleLink>
                  </>
                ) : null}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-text-secondary">
          {t('businessCta')}{' '}
          <LocaleLink href="/contact" className="font-medium text-primary hover:underline">
            {t('contact')}
          </LocaleLink>
        </p>
      </section>
    </div>
  );
}
