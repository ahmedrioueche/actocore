import { BookOpen, Code2, LayoutDashboard } from 'lucide-react';
import { useT } from '@/i18n/useT';

import { CtaButton } from '@/components/site/CtaButton';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getStudioUrl } from '@/lib/site';

export function DocsPage() {
  const { t } = useT('docs');
  usePageMeta('docs');

  const cards = [
    {
      key: 'studio' as const,
      icon: LayoutDashboard,
      href: getStudioUrl(),
      external: true,
      cta: t('studio.link'),
    },
    {
      key: 'sdk' as const,
      icon: Code2,
      href: 'https://github.com',
      external: true,
      cta: t('sdk.link'),
    },
    {
      key: 'quickstart' as const,
      icon: BookOpen,
      href: getStudioUrl(),
      external: true,
      cta: t('studio.link'),
    },
  ];

  return (
    <div className="site-container py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-lg text-text-secondary">{t('subtitle')}</p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {cards.map(({ key, icon: Icon, href, external, cta }) => (
          <article
            key={key}
            className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <div className="mb-4 inline-flex rounded-xl bg-primary-muted p-3 text-primary">
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">{t(`${key}.title`)}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
              {t(`${key}.description`)}
            </p>
            <div className="mt-6">
              <CtaButton href={href} external={external} variant="outline">
                {cta}
              </CtaButton>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
