import { ActocoreLogoMark, type ActocoreLogoMarkVariant } from '@/components/ui/ActocoreLogoMark';
import { cn } from '@/utils/helper';

interface ActocoreIconProps {
  variant?: ActocoreLogoMarkVariant;
  className?: string;
}

export function ActocoreIcon({ variant = 'brand', className }: ActocoreIconProps) {
  return (
    <span className={cn('inline-flex h-full w-full shrink-0', className)} aria-hidden>
      <ActocoreLogoMark variant={variant} className="h-full w-full" />
    </span>
  );
}
