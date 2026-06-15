import { LegalDocument } from '@/components/site/LegalDocument';
import { useT } from '@/i18n/useT';
import { usePageMeta } from '@/hooks/usePageMeta';

const TERMS_SECTION_KEYS = [
  'service',
  'accounts',
  'acceptable',
  'billing',
  'cancellation',
  'availability',
  'ip',
  'termination',
  'liability',
  'contact',
] as const;

export function TermsPage() {
  const { t } = useT('legal.terms');
  usePageMeta('terms');

  return (
    <LegalDocument
      title={t('title')}
      updated={t('updated')}
      intro={t('intro')}
      sections={TERMS_SECTION_KEYS.map((key) => ({
        key,
        title: t(`sections.${key}.title`),
        body: t(`sections.${key}.body`),
      }))}
    />
  );
}
