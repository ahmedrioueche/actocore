import { useTranslation } from 'react-i18next';

export default function ProjectDocsKnowledgePage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('projectDocs.sections.knowledge.title')}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t('projectDocs.sections.knowledge.description')}
        </p>
      </div>

      <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
        {(t('projectDocs.sections.knowledge.bullets', {
          returnObjects: true,
        }) as string[]).map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}
