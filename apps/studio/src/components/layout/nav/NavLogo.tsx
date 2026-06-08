import { Link } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';

import { APP_DATA } from '@/constants/app';
import { cn } from '@/utils/helper';

interface NavLogoProps {
  collapsed: boolean;
  onNavigate?: () => void;
  to?: string;
}

/** Compact static logo for the sidebar — AnimatedLogo is reserved for boot/loading screens. */
export function NavLogo({ collapsed, onNavigate, to = '/projects' }: NavLogoProps) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'flex min-w-0 items-center overflow-hidden py-3 transition-[padding] duration-300',
        collapsed ? 'w-full justify-center px-2' : 'gap-2.5 px-3',
      )}
      aria-label={APP_DATA.name}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gradient shadow-sm">
        <Sparkles className="h-4 w-4 text-primary-contrast" aria-hidden />
      </div>

      {!collapsed ? (
        <div className="min-w-0 truncate leading-tight">
          <span className="text-sm font-bold text-brand-gradient">
            {APP_DATA.brandName}
          </span>
          <span className="text-sm font-semibold text-text-secondary">
            {' '}
            {APP_DATA.shortName}
          </span>
        </div>
      ) : null}
    </Link>
  );
}
