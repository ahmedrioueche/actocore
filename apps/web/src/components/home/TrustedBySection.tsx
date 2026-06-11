import { useT } from '@/i18n/useT';

export function TrustedBySection() {
  const { t } = useT('home.partners');
  const partners = t('items', { returnObjects: true }) as string[];

  return (
    <section className="border-y border-border/50 bg-surface-secondary/30 py-12 backdrop-blur-sm">
      <div className="site-container">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted opacity-80">
          {t('label')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 px-8 grayscale contrast-0 brightness-200 lg:justify-between lg:gap-16">
          {partners.map((name) => (
            <span key={name} className="text-xl font-bold text-text-primary">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
