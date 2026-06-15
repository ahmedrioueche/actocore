import { LegalDocument } from '@/components/site/LegalDocument';
import { useT } from '@/i18n/useT';
import { usePageMeta } from '@/hooks/usePageMeta';

const COMPLIANCE_SECTION_KEYS = [
  'gdpr',
  'dpa',
  'soc2',
  'subprocessors',
  'residency',
  'contact',
] as const;

export function CompliancePage() {
  const { t } = useT('legal.compliance');
  usePageMeta('compliance');

  return (
    <LegalDocument
      title={t('title')}
      updated={t('updated')}
      intro={t('intro')}
      sections={COMPLIANCE_SECTION_KEYS.map((key) => ({
        key,
        title: t(`sections.${key}.title`),
        body: t(`sections.${key}.body`),
      }))}
    />
  );
}
