import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/helper';

export interface SidebarMenuItemLink {
  path: string;
  labelKey: string;
  icon: LucideIcon;
}

interface SidebarMenuItemProps {
  link: SidebarMenuItemLink;
  isActive: boolean;
  isCollapsed: boolean;
  onItemClick: () => void;
}

export function SidebarMenuItem({
  link,
  isActive,
  isCollapsed,
  onItemClick,
}: SidebarMenuItemProps) {
  const { t } = useTranslation();
  const Icon = link.icon;

  return (
    <Link
      to={link.path}
      preload="intent"
      onClick={onItemClick}
      className={cn(
        'group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 transition-all duration-200',
        isActive
          ? 'bg-brand-gradient-soft text-primary shadow-sm'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
      )}
    >
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center">
        <Icon className="h-5 w-5" aria-hidden />
      </span>

      <span
        className={cn(
          'relative z-10 truncate text-sm font-semibold transition-opacity duration-200',
          isCollapsed ? 'pointer-events-none w-0 opacity-0' : 'opacity-100',
        )}
      >
        {t(link.labelKey)}
      </span>
    </Link>
  );
}
