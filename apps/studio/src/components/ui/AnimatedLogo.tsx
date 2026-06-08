import { APP_DATA } from '@/constants/app';
import { ActocoreIcon } from '@/components/ui/ActocoreIcon';
import { cn } from '@/utils/helper';

import '@/styles/animatedLogo.css';

export interface AnimatedLogoProps {
  /** `onDark` = auth panel / mesh loading screen; `default` = light app shell */
  variant?: 'default' | 'onDark';
  compact?: boolean;
  animateOnce?: boolean;
  className?: string;
}

export default function AnimatedLogo({
  variant = 'default',
  compact = false,
  animateOnce = false,
  className,
}: AnimatedLogoProps) {
  const onDark = variant === 'onDark';
  const loop = animateOnce ? 1 : 'infinite';

  return (
    <div
      className={cn(
        'ac-animated-logo',
        compact && 'ac-animated-logo--compact',
        className,
      )}
      aria-label={APP_DATA.name}
    >
      <div
        className={cn(
          'ac-logo-mark ac-logo-mark-animate',
          onDark ? 'ac-logo-mark--on-dark' : 'ac-logo-mark--default',
        )}
        style={{ animationIterationCount: loop }}
      >
        <ActocoreIcon className="h-full w-full rounded-[inherit]" />
      </div>

      {!compact ? (
        <div
          className="ac-logo-wordmark ac-logo-wordmark-animate"
          style={{ animationIterationCount: loop }}
        >
          <span
            className={cn(
              'font-bold tracking-tight',
              onDark ? 'text-white' : 'text-brand-gradient',
              compact ? 'text-lg' : 'text-2xl md:text-3xl',
            )}
          >
            {APP_DATA.brandName}
          </span>
          <span
            className={cn(
              'font-semibold tracking-tight',
              onDark ? 'text-white/75' : 'text-text-secondary',
              compact ? 'text-lg' : 'text-2xl md:text-3xl',
            )}
          >
            {' '}
            {APP_DATA.shortName}
          </span>
        </div>
      ) : null}
    </div>
  );
}
