import { useState } from 'react';

import {
  BillingCycleToggle,
  PricingPlansDeck,
} from '@/components/pricing/PricingPlansDeck';
import { LocaleLink } from '@/i18n/LocaleLink';
import { useT } from '@/i18n/useT';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { revealStyle } from '@/lib/reveal';
import type { SignupBillingCycle } from '@/lib/site';

import { ScrollReveal } from './ScrollReveal';

export function PricingSection() {
  const { t } = useT('home.pricing');
  const { t: tPricing } = useT('pricing');
  const [cycle, setCycle] = useState<SignupBillingCycle>('monthly');
  const { plans, isLoading, error } = usePricingPlans();

  return (
    <ScrollReveal
      as="section"
      id="pricing"
      stagger
      className="relative overflow-hidden py-16 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--ac-blob-primary),transparent_55%)]"
        aria-hidden
      />
      <div className="site-container relative z-10">
        <div
          className="reveal-item mx-auto mb-10 max-w-2xl text-center lg:mb-14"
          style={revealStyle(0)}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            {t('eyebrow')}
          </p>
          <h2 className="mb-4 text-3xl font-bold text-text-primary lg:text-4xl">
            {tPricing('title')}
          </h2>
          <p className="text-lg text-text-secondary">{tPricing('subtitle')}</p>
          <div className="mt-8 flex justify-center">
            <BillingCycleToggle cycle={cycle} onChange={setCycle} />
          </div>
        </div>

        <div className="reveal-item" style={revealStyle(1)}>
          <PricingPlansDeck
            plans={plans}
            isLoading={isLoading}
            error={error}
            cycle={cycle}
          />
        </div>

        <p
          className="reveal-item mt-10 text-center text-sm text-text-secondary"
          style={revealStyle(2)}
        >
          {t('footnote')}{' '}
          <LocaleLink href="/pricing" className="font-semibold text-primary hover:underline">
            {t('viewDetails')}
          </LocaleLink>
        </p>
      </div>
    </ScrollReveal>
  );
}
