import {
  BookOpen,
  LayoutGrid,
  Settings2,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useT } from '@/i18n/useT';
import { cn } from '@/lib/utils';

import type { PlaygroundView } from './types';
import { PLAYGROUND_VIEWS } from './types';

const VIEW_META: Record<
  PlaygroundView,
  { icon: LucideIcon; labelKey: PlaygroundView }
> = {
  'app-layout': { icon: LayoutGrid, labelKey: 'app-layout' },
  knowledge: { icon: BookOpen, labelKey: 'knowledge' },
  actions: { icon: Zap, labelKey: 'actions' },
  'sdk-config': { icon: Settings2, labelKey: 'sdk-config' },
};

type PlaygroundSidebarProps = {
  activeView: PlaygroundView;
  onViewChange: (view: PlaygroundView) => void;
  projectName?: string;
};

export function PlaygroundSidebar({
  activeView,
  onViewChange,
  projectName,
}: PlaygroundSidebarProps) {
  const { t } = useT('playground.nav');

  return (
    <nav
      className="glass-panel flex flex-col gap-2 rounded-2xl border border-border p-1.5"
      aria-label={t('label')}
    >
      {projectName ? (
        <p className="truncate px-2 pt-1 text-xs font-semibold text-text-primary">
          {projectName}
        </p>
      ) : null}
      <div className="flex flex-col gap-1">
      {PLAYGROUND_VIEWS.map((view) => {
        const { icon: Icon } = VIEW_META[view];
        const isActive = activeView === view;

        return (
          <button
            key={view}
            type="button"
            onClick={() => onViewChange(view)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-muted text-primary'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{t(view)}</span>
          </button>
        );
      })}
      </div>
    </nav>
  );
}
