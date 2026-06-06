import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/helper';

export function WorkspaceBadge() {
  const { t } = useTranslation();
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  const roleLabel = t(`roles.${session.role}`, { defaultValue: session.role });

  return (
    <div
      className={cn(
        'flex w-fit max-w-[16rem] items-center gap-2.5 rounded-xl border border-border',
        'bg-surface-secondary/80 px-2.5 py-1.5 sm:max-w-xs sm:gap-3 sm:px-3 sm:py-2',
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient-soft text-primary sm:h-9 sm:w-9">
        <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          {t('nav.workspace')}
        </p>
        <p className="truncate text-sm font-semibold text-text-primary">
          {session.account.name}
        </p>
      </div>
      <span className="hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary md:inline">
        {roleLabel}
      </span>
    </div>
  );
}
