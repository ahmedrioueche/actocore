import { useT } from '@/i18n/useT';
import { asStringArray } from '@/i18n/as-string-array';

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
    <ScrollReveal as="section" className="border-y border-border bg-surface-secondary py-12">
      <div className="site-container">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted opacity-80">
          {t('home.partners.label')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 px-8 grayscale contrast-0 brightness-200 lg:justify-between lg:gap-16">
          {partners.map((name) => (
            <span key={name} className="text-xl font-bold text-text-primary">
              {name}
            </span>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
