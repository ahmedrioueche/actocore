import { Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { ProjectDocsSectionId } from '@/constants/project-docs-nav';
import { PROJECT_DOCS_NAV, projectDocsPath } from '@/constants/project-docs-nav';

type DocsLearnMoreLinkProps = {
  sectionId: ProjectDocsSectionId;
};

export function DocsLearnMoreLink({ sectionId }: DocsLearnMoreLinkProps) {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const item = PROJECT_DOCS_NAV.find((entry) => entry.id === sectionId);

  if (!projectId || !item) {
    return null;
  }

  return (
    <Link
      to={projectDocsPath(item.segment)}
      params={{ projectId }}
      className="font-medium text-primary underline-offset-2 hover:underline"
    >
      {t('projectDocs.learnMore')}
    </Link>
  );
}
