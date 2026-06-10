import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ProjectOverviewCounts } from '@/hooks/use-project-overview';
import { cn } from '@/utils/helper';

interface SetupItem {
  key: keyof ProjectOverviewCounts;
  to: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

interface ProjectOverviewSetupChecklistProps {
  projectId: string;
  counts: ProjectOverviewCounts;
  items: SetupItem[];
}

export function ProjectOverviewSetupChecklist({
  projectId,
  counts,
  items,
}: ProjectOverviewSetupChecklistProps) {
  const { t } = useTranslation();
  const routeParams = { projectId };
  const completedCount = items.filter(
    (item) => counts[item.key] > 0,
  ).length;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('projectOverview.setup.title')}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t('projectOverview.setup.description', {
            completed: completedCount,
            total: items.length,
          })}
        </p>
      </div>

      <ul className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const complete = counts[item.key] > 0;

          return (
            <li key={item.key}>
              <Link
                to={item.to}
                params={routeParams}
                preload="intent"
                className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {complete ? (
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-success"
                    aria-hidden
                  />
                ) : (
                  <Circle
                    className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary"
                    aria-hidden
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        complete ? 'text-success' : 'text-primary',
                      )}
                      aria-hidden
                    />
                    <span className="text-sm font-semibold text-text-primary">
                      {t(item.titleKey)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {t(item.descriptionKey)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
