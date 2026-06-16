import { useT } from '@/i18n/useT';
import { asStringArray } from '@/i18n/as-string-array';
import { revealStyle } from '@/lib/reveal';

import { ScrollReveal } from './ScrollReveal';

const DEFAULT_PARTNERS = [
  'Mercivio',
  'DevFlow',
  'LogicLayer',
  'StackPoint',
  'Aether',
] as const;

export function TrustedBySection() {
  const { t } = useT();
  const partners = asStringArray(
    t('home.partners.items', { returnObjects: true }),
    [...DEFAULT_PARTNERS],
  );

  return (
    <ScrollReveal as="section" stagger className="border-y border-border bg-surface-secondary py-12">
      <div className="site-container">
        <p
          className="reveal-item mb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted opacity-80"
          style={revealStyle(0)}
        >
          {t('home.partners.label')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 px-8 grayscale contrast-0 brightness-200 lg:justify-between lg:gap-16">
          {partners.map((name, index) => (
            <span
              key={name}
              className="reveal-item text-xl font-bold text-text-primary"
              style={revealStyle(index + 1, 40)}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
