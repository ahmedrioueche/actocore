import { useT } from '@/i18n/useT';

import { CtaButton } from '@/components/site/CtaButton';
import { LocaleLink } from '@/i18n/LocaleLink';
import { playgroundPath, studioAuthPath } from '@/lib/site';
import { revealStyle } from '@/lib/reveal';

import { ScrollReveal } from './ScrollReveal';

export function FinalCtaSection() {
  const { t } = useT('home.finalCta');

  return (
    <ScrollReveal as="section" stagger className="relative overflow-hidden py-16 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-primary-muted" aria-hidden />
      <div className="site-container mx-auto max-w-4xl text-center">
        <h2
          className="reveal-item mb-8 text-4xl font-extrabold leading-tight text-text-primary lg:text-5xl"
          style={revealStyle(0)}
        >
          {t('title')}
        </h2>
        <p
          className="reveal-item mb-12 text-lg text-text-secondary"
          style={revealStyle(1)}
        >
          {t('subtitle')}
        </p>
        <div
          className="reveal-item flex flex-col items-center justify-center gap-4 sm:flex-row"
          style={revealStyle(2)}
        >
          <CtaButton
            href={studioAuthPath('signup')}
            className="w-full px-12 py-5 text-lg sm:w-auto"
          >
            {t('ctaPrimary')}
          </CtaButton>
          <LocaleLink
            href={playgroundPath()}
            className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-10 py-5 text-lg font-semibold text-text-primary transition-colors hover:bg-surface-hover sm:w-auto"
          >
            {t('ctaSecondary')}
          </LocaleLink>
        </div>
        <p className="reveal-item mt-8 text-sm text-muted" style={revealStyle(3)}>
          {t('footnote')}
        </p>
      </div>
    </ScrollReveal>
  );
}
