import { Code2, Layers, Shield } from 'lucide-react';

import { CtaButton } from '@/components/site/CtaButton';
import { PageHero } from '@/components/site/PageHero';
import { ProseSection } from '@/components/site/ProseSection';
import { useT } from '@/i18n/useT';
import { usePageMeta } from '@/hooks/usePageMeta';
import { studioAuthPath } from '@/lib/site';

const VALUE_KEYS = [
  { key: 'developer' as const, icon: Code2 },
  { key: 'tenant' as const, icon: Shield },
  { key: 'production' as const, icon: Layers },
] as const;

export function AboutPage() {
  const { t } = useT('about');
  usePageMeta('about');

  return (
    <div className="site-container py-16 sm:py-20">
      <PageHero eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="mx-auto mt-14 max-w-3xl space-y-12">
        <ProseSection title={t('mission.title')} body={t('mission.body')} />
        <ProseSection title={t('audience.title')} body={t('audience.body')} />

        <section>
          <h2 className="mb-6 text-2xl font-bold text-text-primary">{t('values.title')}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {VALUE_KEYS.map(({ key, icon: Icon }) => (
              <article
                key={key}
                className="glass-panel rounded-2xl border border-border p-6"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary-muted p-3 text-primary">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="font-semibold text-text-primary">{t(`values.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`values.${key}.body`)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="text-center">
          <CtaButton href={studioAuthPath('signup')} className="px-8 py-4 text-base">
            {t('cta')}
          </CtaButton>
        </div>
      </div>
    </div>
  );
}
