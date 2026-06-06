import { useParams } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  KeyRound,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/states';
import { useProject } from '@/hooks/use-projects';

export type ProjectSection =
  | 'knowledge'
  | 'actions'
  | 'sdk-config'
  | 'api-keys'
  | 'usage';

const SECTION_ICONS: Record<ProjectSection, LucideIcon> = {
  knowledge: BookOpen,
  actions: Zap,
  'sdk-config': SlidersHorizontal,
  'api-keys': KeyRound,
  usage: BarChart3,
};

const SECTION_I18N_KEYS: Record<ProjectSection, string> = {
  knowledge: 'knowledge',
  actions: 'actions',
  'sdk-config': 'sdkConfig',
  'api-keys': 'apiKeys',
  usage: 'usage',
};

interface ProjectSectionPageProps {
  section: ProjectSection;
}

export default function ProjectSectionPage({ section }: ProjectSectionPageProps) {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const projectQuery = useProject(projectId ?? null);
  const projectName = projectQuery.data?.name;
  const Icon = SECTION_ICONS[section];
  const sectionKey = SECTION_I18N_KEYS[section];

  return (
    <>
      <PageHeader
        title={t(`projectPages.sections.${sectionKey}.title`)}
        subtitle={
          projectName
            ? t('projectPages.sectionSubtitle', { project: projectName })
            : undefined
        }
      />
      <EmptyState
        icon={Icon}
        title={t(`projectPages.sections.${sectionKey}.emptyTitle`)}
        description={t(`projectPages.sections.${sectionKey}.emptyDescription`)}
      />
    </>
  );
}
