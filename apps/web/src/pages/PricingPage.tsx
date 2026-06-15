import { useState } from 'react';

import { CtaButton } from '@/components/site/CtaButton';
import { PageHero } from '@/components/site/PageHero';
import { LocaleLink } from '@/i18n/LocaleLink';
import { useT } from '@/i18n/useT';
import { asStringArray } from '@/i18n/as-string-array';
import { usePageMeta } from '@/hooks/usePageMeta';
import { studioAuthPath } from '@/lib/site';
import { cn } from '@/lib/utils';

const PLAN_IDS = ['free', 'starter', 'pro', 'business'] as const;
const FAQ_KEYS = ['billing', 'trial', 'tokens', 'upgrade', 'enterprise'] as const;

type BillingCycle = 'monthly' | 'yearly';

export function PricingPage() {
  const { t } = useT('pricing');
  usePageMeta('pricing');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  return (
    <div className="site-container py-16 sm:py-20">
      <PageHero title={t('title')} subtitle={t('subtitle')}>
        <div className="mt-8 inline-flex rounded-xl border border-border bg-surface p-1">
          {(['monthly', 'yearly'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCycle(option)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                cycle === option
                  ? 'bg-primary text-primary-contrast'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t(option)}
            </button>
          ))}
        </div>
      </PageHero>

      <div className="mt-14 grid gap-6 lg:grid-cols-4">
        {PLAN_IDS.map((planId) => {
          const isPro = planId === 'pro';
          const features = asStringArray(
            t(`plans.${planId}.features`, { returnObjects: true }),
          );
          const price =
            cycle === 'monthly'
              ? t(`plans.${planId}.priceMonthly`)
              : t(`plans.${planId}.priceYearly`);
          const period = cycle === 'monthly' ? t('perMonth') : t('perYear');

          return (
            <article
              key={planId}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-surface p-6 shadow-sm',
                isPro ? 'border-primary shadow-brand' : 'border-border',
              )}
            >
              {isPro ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-contrast">
                  {t('plans.pro.badge')}
                </span>
              ) : null}
              <h2 className="text-xl font-semibold text-text-primary">{t(`plans.${planId}.name`)}</h2>
              <p className="mt-2 text-sm text-text-secondary">{t(`plans.${planId}.description`)}</p>
              <p className="mt-6 text-3xl font-bold text-text-primary">
                {price}
                <span className="text-base font-normal text-text-secondary">{period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-text-secondary">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-primary" aria-hidden>
                      •
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <CtaButton
                  href={studioAuthPath('signup')}
                  className="w-full text-center"
                  variant={isPro ? 'primary' : 'outline'}
                >
                  {t('cta')}
                </CtaButton>
              </div>
            </article>
          );
        })}
      </div>

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
