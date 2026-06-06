import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/helper';

interface SidebarFooterProps {
  isMobile: boolean;
  isPinned: boolean;
  isCollapsed: boolean;
  onTogglePin: () => void;
  onLogout: () => void;
  logoutPending?: boolean;
}

export function SidebarFooter({
  isMobile,
  isPinned,
  isCollapsed,
  onTogglePin,
  onLogout,
  logoutPending,
}: SidebarFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 border-t border-border p-3">
      {!isMobile ? (
        <button
          type="button"
          onClick={onTogglePin}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
            isPinned
              ? 'bg-primary/10 text-primary hover:bg-primary/15'
              : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
          )}
        >
          {isPinned ? (
            <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden />
          ) : (
            <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden />
          )}
          <span
            className={cn(
              'truncate transition-opacity duration-200',
              isCollapsed ? 'w-0 opacity-0' : 'opacity-100',
            )}
          >
            {isPinned ? t('nav.unpin') : t('nav.pin')}
          </span>
        </button>
      ) : (
        <button
          type="button"
          disabled={logoutPending}
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/15 disabled:opacity-50"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {t('auth.logout')}
        </button>
      )}
    </div>
  );
}
