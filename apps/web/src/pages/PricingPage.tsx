import { useT } from '@/i18n/useT';

import { CtaButton } from '@/components/site/CtaButton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { studioAuthPath } from '@/lib/site';
import { cn } from '@/lib/utils';

const PLAN_IDS = ['free', 'starter', 'pro', 'business'] as const;

export function PricingPage() {
  const { t } = useT('pricing');
  usePageMeta('pricing');

  return (
    <div className="site-container py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-lg text-text-secondary">{t('subtitle')}</p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-4">
        {PLAN_IDS.map((planId) => {
          const isPro = planId === 'pro';
          const features = t(`plans.${planId}.features`, { returnObjects: true }) as string[];

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
              <h2 className="text-xl font-semibold text-text-primary">
                {t(`plans.${planId}.name`)}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {t(`plans.${planId}.description`)}
              </p>
              <p className="mt-6 text-3xl font-bold text-text-primary">
                {t(`plans.${planId}.priceMonthly`)}
                <span className="text-base font-normal text-text-secondary">
                  {t('perMonth')}
                </span>
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
    </div>
  );
}
