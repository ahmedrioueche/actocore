import { useTranslation } from 'react-i18next';

import { DocCodeBlock } from '@/components/projects/DocCodeBlock';
import Tip from '@/components/ui/Tip';
import { PROJECT_DOCS_LOCALE_SYNC } from '@/constants/project-docs';

export function DocsSdkLanguagesContent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        {t('projectDocs.sections.sdkLanguages.description')}
      </p>

      <Tip title={t('projectDocs.sections.sdkLanguages.hostLocaleTitle')}>
        <p>{t('projectDocs.sections.sdkLanguages.hostLocaleBody')}</p>
      </Tip>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('projectDocs.sections.sdkLanguages.studioTitle')}
        </h3>
        <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
          {(t('projectDocs.sections.sdkLanguages.studioBullets', {
            returnObjects: true,
          }) as string[]).map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('projectDocs.sections.sdkLanguages.runtimeTitle')}
        </h3>
        <p className="text-sm text-text-secondary">
          {t('projectDocs.sections.sdkLanguages.runtimeBody')}
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
          {(t('projectDocs.sections.sdkLanguages.runtimeBullets', {
            returnObjects: true,
          }) as string[]).map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </section>

      <DocCodeBlock
        label={t('projectDocs.sections.sdkLanguages.codeLabel')}
        code={PROJECT_DOCS_LOCALE_SYNC}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('projectDocs.sections.sdkLanguages.translateTitle')}
        </h3>
        <p className="text-sm text-text-secondary">
          {t('projectDocs.sections.sdkLanguages.translateBody')}
        </p>
      </section>
    </div>
  );
}
