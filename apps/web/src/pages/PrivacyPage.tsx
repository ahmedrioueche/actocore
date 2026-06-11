import { useT } from '@/i18n/useT';

import { usePageMeta } from '@/hooks/usePageMeta';

const SECTION_KEYS = ['collect', 'use', 'share', 'contact'] as const;

export function PrivacyPage() {
  const { t } = useT('legal.privacy');
  usePageMeta('privacy');

  return (
    <div className="site-container max-w-3xl py-16 sm:py-20">
      <h1 className="text-3xl font-bold text-text-primary">{t('title')}</h1>
      <p className="mt-2 text-sm text-text-secondary">{t('updated')}</p>
      <p className="mt-6 text-text-secondary">{t('intro')}</p>

      <div className="mt-10 space-y-8">
        {SECTION_KEYS.map((key) => (
          <section key={key}>
            <h2 className="text-xl font-semibold text-text-primary">
              {t(`sections.${key}.title`)}
            </h2>
            <p className="mt-3 leading-relaxed text-text-secondary">
              {t(`sections.${key}.body`)}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
