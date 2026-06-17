import { useTranslation } from 'react-i18next';

import { DocCodeBlock } from '@/components/projects/DocCodeBlock';
import Tip from '@/components/ui/Tip';

const LOAD_REMOTE_CONFIG_EXAMPLE = `<ActocoreProvider
  apiKey={apiKey}
  loadRemoteConfig
  actions={{ ... }}
>`;

export function DocsSdkConfigContent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        {t('projectDocs.sections.sdkConfig.description')}
      </p>

      <Tip title={t('projectDocs.sections.sdkConfig.loadRemoteConfigTitle')}>
        <p>{t('projectDocs.sections.sdkConfig.loadRemoteConfigBody')}</p>
      </Tip>

      <DocCodeBlock
        label={t('projectDocs.sections.sdkConfig.codeLabel')}
        code={LOAD_REMOTE_CONFIG_EXAMPLE}
      />

      <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
        {(t('projectDocs.sections.sdkConfig.bullets', {
          returnObjects: true,
        }) as string[]).map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}
