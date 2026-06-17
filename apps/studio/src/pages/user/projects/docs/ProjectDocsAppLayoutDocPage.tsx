import { useTranslation } from 'react-i18next';

import { DocsAppLayoutContent } from '@/components/projects/docs/sections/DocsAppLayoutContent';

export default function ProjectDocsAppLayoutPage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('projectDocs.sections.appLayout.title')}
        </h2>
      </div>
      <DocsAppLayoutContent />
    </section>
  );
}
