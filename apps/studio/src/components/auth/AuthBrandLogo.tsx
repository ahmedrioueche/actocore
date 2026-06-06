import { Sparkles } from 'lucide-react';

import { APP_DATA } from '@/constants/app';
import { cn } from '@/utils/helper';

interface AuthBrandLogoProps {
  compact?: boolean;
}

export function AuthBrandLogo({ compact = false }: AuthBrandLogoProps) {
  return (
    <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-3')}>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm',
          compact ? 'h-9 w-9' : 'h-12 w-12',
        )}
        aria-hidden
      >
        <Sparkles
          className={cn(
            'text-primary-contrast',
            compact ? 'h-5 w-5' : 'h-7 w-7',
          )}
        />
      </div>
      <span
        className={cn(
          'font-semibold tracking-tight text-primary-contrast',
          compact ? 'text-base' : 'text-xl',
        )}
      >
        <span className="font-bold">{APP_DATA.brandName}</span>
        <span className="font-medium opacity-80"> {APP_DATA.shortName}</span>
      </span>
    </div>
  );
}
