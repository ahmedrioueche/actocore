import { useT } from '@/i18n/useT';

import { RevealOnScroll } from './RevealOnScroll';

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
    <section className="py-16 lg:py-24">
      <div className="site-container">
        <h2 className="mb-16 text-center text-3xl font-bold text-text-primary lg:text-4xl">
          {t('title')}
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIAL_KEYS.map((key) => {
            const name = t(`items.${key}.name`);

            return (
              <RevealOnScroll key={key}>
                <article className="glass-panel flex h-full flex-col justify-between rounded-xl p-8">
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
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
