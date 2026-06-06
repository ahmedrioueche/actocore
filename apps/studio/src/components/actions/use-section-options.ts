import { useTranslation } from 'react-i18next';

import { useActionSections } from '@/hooks/use-action-sections';

export interface SectionSelectOption {
  value: string;
  label: string;
}

/**
 * Section options for the action create/edit selects. The empty value maps to
 * "uncategorized" (no section).
 */
export function useSectionOptions(
  projectId: string | null,
): SectionSelectOption[] {
  const { t } = useTranslation();
  const sectionsQuery = useActionSections(projectId);
  const sections = sectionsQuery.data ?? [];

  return [
    { value: '', label: t('projectActions.sections.uncategorized') },
    ...sections.map((section) => ({
      value: section.id,
      label: section.name,
    })),
  ];
}
