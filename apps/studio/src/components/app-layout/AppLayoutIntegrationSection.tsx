import { useTranslation } from 'react-i18next';

import { DocsLearnMoreLink } from '@/components/projects/docs/DocsLearnMoreLink';
import Tip from '@/components/ui/Tip';

export function AppLayoutIntegrationSection() {
  const { t } = useTranslation();

  return (
    <Tip title={t('projectDocs.contextualTips.appLayout.title')}>
      <p>
        {t('projectDocs.contextualTips.appLayout.body')}{' '}
        <DocsLearnMoreLink sectionId="app-layout" />
      </p>
    </Tip>
  );
}
