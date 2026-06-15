import { LegalDocument } from '@/components/site/LegalDocument';
import { useT } from '@/i18n/useT';
import { usePageMeta } from '@/hooks/usePageMeta';

const PRIVACY_SECTION_KEYS = [
  'collect',
  'use',
  'share',
  'retention',
  'cookies',
  'subprocessors',
  'transfers',
  'rights',
  'contact',
] as const;

export function PrivacyPage() {
  const { t } = useT('legal.privacy');
  usePageMeta('privacy');

  return (
    <LegalDocument
      title={t('title')}
      updated={t('updated')}
      intro={t('intro')}
      sections={PRIVACY_SECTION_KEYS.map((key) => ({
        key,
        title: t(`sections.${key}.title`),
        body: t(`sections.${key}.body`),
      }))}
    />
  );
}
