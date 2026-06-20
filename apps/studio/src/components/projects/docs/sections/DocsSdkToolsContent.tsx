import { useTranslation } from 'react-i18next';

import { DocCodeBlock } from '@/components/projects/DocCodeBlock';

export function DocsSdkToolsContent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        {t('projectDocs.sections.sdkTools.description')}
      </p>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('projectDocs.sections.sdkTools.coreTitle')}
        </h3>
        <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
          {(t('projectDocs.sections.sdkTools.coreBullets', {
            returnObjects: true,
          }) as string[]).map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('projectDocs.sections.sdkTools.actionsTitle')}
        </h3>
        <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
          {(t('projectDocs.sections.sdkTools.actionsBullets', {
            returnObjects: true,
          }) as string[]).map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('projectDocs.sections.sdkTools.manifestTitle')}
        </h3>
        <p className="text-sm text-text-secondary">
          {t('projectDocs.sections.sdkTools.manifestBody')}
        </p>
        <DocCodeBlock
          label={t('projectDocs.sections.sdkTools.manifestCodeLabel')}
          code={t('projectDocs.sections.sdkTools.manifestCode')}
        />
      </section>
    </div>
  );
}
