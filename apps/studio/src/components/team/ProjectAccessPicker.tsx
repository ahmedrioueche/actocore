import { useTranslation } from 'react-i18next';

import Checkbox from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProjectsList } from '@/hooks/use-projects';

interface ProjectAccessPickerProps {
  selectedIds: string[];
  onChange: (projectIds: string[]) => void;
  disabled?: boolean;
  error?: string | null;
}

export function ProjectAccessPicker({
  selectedIds,
  onChange,
  disabled = false,
  error,
}: ProjectAccessPickerProps) {
  const { t } = useTranslation();
  const projectsQuery = useProjectsList();

  const toggleProject = (projectId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, projectId]);
      return;
    }
    onChange(selectedIds.filter((id) => id !== projectId));
  };

  if (projectsQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  const projects = projectsQuery.data ?? [];

  if (projects.length === 0) {
    return (
      <p className="text-sm text-text-secondary">{t('team.projects.noProjects')}</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-primary">
        {t('team.projects.label')}
      </p>
      <p className="text-sm text-text-secondary">{t('team.projects.hint')}</p>
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {projects.map((project) => (
          <Checkbox
            key={project.id}
            id={`team-project-${project.id}`}
            checked={selectedIds.includes(project.id)}
            onChange={(checked) => toggleProject(project.id, checked)}
            label={project.name}
            disabled={disabled}
          />
        ))}
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
