import { ArrowRight, CheckCircle } from 'lucide-react';
import { useT } from '@/i18n/useT';

import { CtaButton } from '@/components/site/CtaButton';
import { studioAuthPath } from '@/lib/site';

import { AnimatedBlobs } from './AnimatedBlobs';
import { HeroDemoTerminal } from './HeroDemoTerminal';

const TRUST_KEYS = ['gdpr', 'zeroRetention', 'uptime'] as const;

export function HeroSection() {
  const { t } = useT('home.hero');

  return (
    <section className="relative overflow-hidden py-16 lg:py-32">
      <AnimatedBlobs />
      <div className="site-container relative z-10">
        <div className="flex flex-col items-center gap-16 lg:flex-row">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-muted px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {t('badge')}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-brand-gradient">{t('title')}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-text-secondary lg:mx-0">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4 lg:justify-start">
              <CtaButton
                href={studioAuthPath('signup')}
                className="gap-2 px-8 py-4 text-base"
              >
                {t('ctaPrimary')}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </CtaButton>
              <CtaButton
                href="mailto:engineering@actocore.pro"
                variant="outline"
                className="glass-panel px-8 py-4 text-base hover:bg-surface-hover"
              >
                {t('ctaSecondary')}
              </CtaButton>
            </div>
            <div className="flex flex-wrap justify-center gap-8 pt-8 opacity-60 lg:justify-start">
              {TRUST_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" aria-hidden />
                  <span>{t(`trust.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative w-full max-w-2xl flex-1">
            <HeroDemoTerminal />
          </div>
        </div>
      </div>
    </section>
  );
}
