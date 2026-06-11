import { ACTOCORE_ICON_URL } from '@/constants/brand-assets';
import { cn } from '@/utils/helper';

interface ActocoreIconProps {
  className?: string;
  imageClassName?: string;
}

/** Crops the hex mark from the wide ActoCore icon SVG in `public/`. */
export function ActocoreIcon({ className, imageClassName }: ActocoreIconProps) {
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden', className)}
      aria-hidden
    >
      <img
        src={ACTOCORE_ICON_URL}
        alt=""
        className={cn(
          'absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2',
          imageClassName,
        )}
        style={{ width: '340%' }}
      />
    </div>
  );
}
