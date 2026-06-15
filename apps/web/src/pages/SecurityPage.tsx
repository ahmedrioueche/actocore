import { LegalDocument } from '@/components/site/LegalDocument';
import { useT } from '@/i18n/useT';
import { usePageMeta } from '@/hooks/usePageMeta';

const SECURITY_SECTION_KEYS = [
  'isolation',
  'encryption',
  'apiKeys',
  'audit',
  'incident',
  'contact',
] as const;

export function SecurityPage() {
  const { t } = useT('legal.security');
  usePageMeta('security');

  return (
    <LegalDocument
      title={t('title')}
      updated={t('updated')}
      intro={t('intro')}
      sections={SECURITY_SECTION_KEYS.map((key) => ({
        key,
        title: t(`sections.${key}.title`),
        body: t(`sections.${key}.body`),
      }))}
    />
  );
}
