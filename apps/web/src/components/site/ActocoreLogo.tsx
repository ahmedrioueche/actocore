import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

import { ActocoreLogoMark, type ActocoreLogoMarkVariant } from './ActocoreLogoMark';

export type ActocoreLogoVariant = ActocoreLogoMarkVariant | 'auto';

type ActocoreLogoProps = {
  variant?: ActocoreLogoVariant;
  className?: string;
  size?: number;
};

export function ActocoreLogo({
  variant = 'auto',
  className,
  size = 32,
}: ActocoreLogoProps) {
  const { resolvedTheme } = useTheme();
  const markVariant: ActocoreLogoMarkVariant =
    variant === 'auto' ? (resolvedTheme === 'dark' ? 'dark' : 'brand') : variant;

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <ActocoreLogoMark variant={markVariant} className="h-full w-full" />
    </span>
  );
}
