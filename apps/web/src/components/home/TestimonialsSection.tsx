import { useT } from '@/i18n/useT';
import { revealStyle } from '@/lib/reveal';

import { PlaygroundCta } from './PlaygroundCta';
import { ScrollReveal } from './ScrollReveal';

const TESTIMONIAL_KEYS = ['marcus', 'sarah', 'alex'] as const;

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-sm font-bold text-text-primary"
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function TestimonialsSection() {
  const { t } = useT('home.testimonials');

  return (
    <ScrollReveal as="section" stagger className="py-16 lg:py-24">
      <div className="site-container">
        <div className="reveal-item mb-16 text-center" style={revealStyle(0)}>
          <h2 className="text-3xl font-bold text-text-primary lg:text-4xl">{t('title')}</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIAL_KEYS.map((key, index) => {
            const name = t(`items.${key}.name`);

            return (
              <article
                key={key}
                className="reveal-item reveal-item-scale glass-panel flex h-full flex-col justify-between rounded-xl p-8"
                style={revealStyle(index + 1)}
              >
                <p className="mb-8 italic leading-relaxed text-text-primary">
                  &ldquo;{t(`items.${key}.quote`)}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <AvatarInitials name={name} />
                  <div>
                    <p className="font-bold text-text-primary">{name}</p>
                    <p className="text-sm text-muted">{t(`items.${key}.role`)}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div
          className="reveal-item mt-12 flex flex-col items-center gap-3 text-center lg:mt-16"
          style={revealStyle(TESTIMONIAL_KEYS.length + 1)}
        >
          <p className="max-w-xl text-text-secondary">{t('ctaHint')}</p>
          <PlaygroundCta className="px-8 py-3.5 text-base" />
        </div>
      </div>
    </ScrollReveal>
  );
}
