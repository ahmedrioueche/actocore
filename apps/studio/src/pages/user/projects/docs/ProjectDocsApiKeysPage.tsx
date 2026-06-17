import { useTranslation } from 'react-i18next';

import { DocCodeBlock } from '@/components/projects/DocCodeBlock';
import { PROJECT_DOCS_ENV_EXAMPLE } from '@/constants/project-docs';

export default function ProjectDocsApiKeysPage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('projectDocs.sections.apiKeys.title')}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t('projectDocs.sections.apiKeys.description')}
        </p>
      </div>

      <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
        {(t('projectDocs.sections.apiKeys.bullets', {
          returnObjects: true,
        }) as string[]).map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      <DocCodeBlock
        label={t('projectDocs.quickStart.envLabel')}
        code={PROJECT_DOCS_ENV_EXAMPLE}
      />
    </section>
  );
}
