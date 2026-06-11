import { useT } from '@/i18n/useT';

import { CtaButton } from '@/components/site/CtaButton';
import { LocaleLink } from '@/i18n/LocaleLink';
import { studioAuthPath } from '@/lib/site';

export function FinalCtaSection() {
  const { t } = useT('home.finalCta');

  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-primary-muted" aria-hidden />
      <div className="site-container mx-auto max-w-4xl text-center">
        <h2 className="mb-8 text-4xl font-extrabold leading-tight text-text-primary lg:text-5xl">
          {t('title')}
        </h2>
        <p className="mb-12 text-lg text-text-secondary">{t('subtitle')}</p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <CtaButton
            href={studioAuthPath('signup')}
            className="w-full px-12 py-5 text-lg sm:w-auto"
          >
            {t('ctaPrimary')}
          </CtaButton>
          <LocaleLink
            href="/docs"
            className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-10 py-5 text-lg font-semibold text-text-primary transition-colors hover:bg-surface-hover sm:w-auto"
          >
            {t('ctaSecondary')}
          </LocaleLink>
        </div>
        <p className="mt-8 text-sm text-muted">{t('footnote')}</p>
      </div>
    </section>
  );
}
