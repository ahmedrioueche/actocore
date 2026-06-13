import { useTranslation } from 'react-i18next';

import { DocCodeBlock } from '@/components/projects/DocCodeBlock';
import Tip from '@/components/ui/Tip';
import {
  APP_LAYOUT_HOST_CONTEXT_HOOK,
  APP_LAYOUT_HOST_CONTEXT_ONE_LINER,
} from '@/constants/app-layout-integration';

export function AppLayoutIntegrationSection() {
  const { t } = useTranslation();

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface px-4 py-5 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('projectLayout.integration.title')}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t('projectLayout.integration.description')}
        </p>
      </div>

      <Tip title={t('projectLayout.integration.tipTitle')}>
        <p>{t('projectLayout.integration.tipBody')}</p>
      </Tip>

      <DocCodeBlock
        label={t('projectLayout.integration.hookLabel')}
        code={APP_LAYOUT_HOST_CONTEXT_HOOK}
      />
      <DocCodeBlock
        label={t('projectLayout.integration.oneLinerLabel')}
        code={APP_LAYOUT_HOST_CONTEXT_ONE_LINER}
      />
    </section>
  );
}
