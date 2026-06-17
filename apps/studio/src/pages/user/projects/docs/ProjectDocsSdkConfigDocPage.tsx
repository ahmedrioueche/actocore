import { useTranslation } from 'react-i18next';

import { DocsSdkConfigContent } from '@/components/projects/docs/sections/DocsSdkConfigContent';

export default function ProjectDocsSdkConfigDocPage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('projectDocs.sections.sdkConfig.title')}
        </h2>
      </div>
      <DocsSdkConfigContent />
    </section>
  );
}
