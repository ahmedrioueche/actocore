import { useTranslation } from 'react-i18next';

import { DocsSdkLanguagesContent } from '@/components/projects/docs/sections/DocsSdkLanguagesContent';

export default function ProjectDocsSdkLanguagesPage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('projectDocs.sections.sdkLanguages.title')}
        </h2>
      </div>
      <DocsSdkLanguagesContent />
    </section>
  );
}
