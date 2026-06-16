import { APP_DATA } from '@/constants/app';
import { ActocoreIcon } from '@/components/ui/ActocoreIcon';
import { cn } from '@/utils/helper';

interface AuthBrandLogoProps {
  compact?: boolean;
}

export function AuthBrandLogo({ compact = false }: AuthBrandLogoProps) {
  return (
    <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-3')}>
      <ActocoreIcon
        variant="inverse"
        className={cn('shrink-0', compact ? 'h-8 w-8' : 'h-10 w-10')}
      />
      <span
        className={cn(
          'font-semibold tracking-tight text-primary-contrast',
          compact ? 'text-base' : 'text-2xl',
        )}
      >
        <span className="font-bold">{APP_DATA.brandName}</span>
        <span className="font-medium opacity-80"> {APP_DATA.shortName}</span>
      </span>
    </div>
  );
}
