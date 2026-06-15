import { ExternalLink } from 'lucide-react';

import { CodeBlock } from '@/components/site/CodeBlock';
import { CtaButton } from '@/components/site/CtaButton';
import { PageHero } from '@/components/site/PageHero';
import { ProseSection } from '@/components/site/ProseSection';
import { useT } from '@/i18n/useT';
import { asStringArray } from '@/i18n/as-string-array';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getStudioUrl, studioAuthPath } from '@/lib/site';

const NPM_URL = 'https://www.npmjs.com/package/@ahmedrioueche/actocore-sdk';

export function DocsPage() {
  const { t } = useT('docs');
  usePageMeta('docs');

  const studioBullets = asStringArray(
    t('sections.studio.bullets', { returnObjects: true }),
  );

  return (
    <div className="site-container py-16 sm:py-20">
      <PageHero eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="mx-auto mt-14 max-w-3xl space-y-12">
        <section className="space-y-4">
          <ProseSection title={t('sections.install.title')} body={t('sections.install.body')} />
          <CodeBlock label={t('sections.install.codeLabel')} code={t('sections.install.code')} />
        </section>

        <section className="space-y-4">
          <ProseSection title={t('sections.styles.title')} body={t('sections.styles.body')} />
          <CodeBlock label={t('sections.styles.codeLabel')} code={t('sections.styles.code')} />
        </section>

        <section className="space-y-4">
          <ProseSection title={t('sections.credentials.title')} body={t('sections.credentials.body')} />
          <CodeBlock label={t('sections.credentials.codeLabel')} code={t('sections.credentials.code')} />
        </section>

        <section className="space-y-4">
          <ProseSection title={t('sections.embed.title')} body={t('sections.embed.body')} />
          <CodeBlock label={t('sections.embed.codeLabel')} code={t('sections.embed.code')} />
        </section>

        <section className="space-y-4">
          <ProseSection title={t('sections.studio.title')} body={t('sections.studio.body')} />
          <ul className="list-inside list-disc space-y-2 text-sm text-text-secondary">
            {studioBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <CtaButton href={getStudioUrl()} external variant="outline">
            {t('studioCta')}
          </CtaButton>
        </section>

        <section className="glass-panel rounded-2xl border border-border p-6">
          <ProseSection title={t('sections.next.title')} body={t('sections.next.body')} />
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaButton href={NPM_URL} external variant="outline" className="gap-2">
              {t('npmLink')}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </CtaButton>
            <CtaButton href={studioAuthPath('signup')}>{t('signupCta')}</CtaButton>
          </div>
        </section>
      </div>
    </div>
  );
}
