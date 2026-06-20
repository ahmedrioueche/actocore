import { useTranslation } from 'react-i18next';

import { DocsSdkToolsContent } from '@/components/projects/docs/sections/DocsSdkToolsContent';

export default function ProjectDocsSdkToolsPage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('projectDocs.sections.sdkTools.title')}
        </h2>
      </div>
      <DocsSdkToolsContent />
    </section>
  );
}
