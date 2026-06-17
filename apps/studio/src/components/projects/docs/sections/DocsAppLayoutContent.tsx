import { useTranslation } from 'react-i18next';

import { DocCodeBlock } from '@/components/projects/DocCodeBlock';
import Tip from '@/components/ui/Tip';
import {
  APP_LAYOUT_HOST_CONTEXT_HOOK,
  APP_LAYOUT_HOST_CONTEXT_ONE_LINER,
} from '@/constants/app-layout-integration';

export function DocsAppLayoutContent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        {t('projectDocs.sections.appLayout.description')}
      </p>

      <Tip title={t('projectDocs.sections.appLayout.tipTitle')}>
        <p>{t('projectDocs.sections.appLayout.tipBody')}</p>
      </Tip>

      <DocCodeBlock
        label={t('projectDocs.sections.appLayout.hookLabel')}
        code={APP_LAYOUT_HOST_CONTEXT_HOOK}
      />
      <DocCodeBlock
        label={t('projectDocs.sections.appLayout.oneLinerLabel')}
        code={APP_LAYOUT_HOST_CONTEXT_ONE_LINER}
      />
    </div>
  );
}
