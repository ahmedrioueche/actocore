import { useId } from 'react';

import { cn } from '@/utils/helper';

export type ActocoreLogoMarkVariant = 'brand' | 'dark' | 'inverse';

type ActocoreLogoMarkProps = {
  variant: ActocoreLogoMarkVariant;
  className?: string;
};

const VARIANT_STYLES = {
  brand: {
    outer: '#4f46e5',
    mid: '#7c3aed',
    inner: '#a855f7',
    core: '#ffffff',
    coreOpacity: 0.95,
    fillOpacity: 0.14,
  },
  dark: {
    outer: '#a5b4fc',
    mid: '#c4b5fd',
    inner: '#e9d5ff',
    core: '#0f172a',
    coreOpacity: 0.92,
    fillOpacity: 0.18,
  },
  inverse: {
    outer: '#ffffff',
    mid: '#ffffff',
    inner: '#ffffff',
    core: '#4f46e5',
    coreOpacity: 1,
    fillOpacity: 0.16,
  },
} as const;

export function ActocoreLogoMark({ variant, className }: ActocoreLogoMarkProps) {
  const uid = useId().replace(/:/g, '');
  const gradientId = `actocore-logo-${uid}`;
  const colors = VARIANT_STYLES[variant];

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="ActoCore"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block h-full w-full shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.outer} />
          <stop offset="55%" stopColor={colors.mid} />
          <stop offset="100%" stopColor={colors.inner} />
        </linearGradient>
      </defs>
      <g transform="translate(100 100)">
        <polygon
          points="0,-66 57.2,-33 57.2,33 0,66 -57.2,33 -57.2,-33"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.5"
        />
        <polygon
          points="0,-44 38.1,-22 38.1,22 0,44 -38.1,22 -38.1,-22"
          fill={`url(#${gradientId})`}
          fillOpacity={colors.fillOpacity}
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
        />
        <circle cx="0" cy="-66" r="7" fill={`url(#${gradientId})`} />
        <circle cx="57.2" cy="-33" r="7" fill={`url(#${gradientId})`} />
        <circle cx="57.2" cy="33" r="7" fill={`url(#${gradientId})`} />
        <circle cx="0" cy="66" r="7" fill={`url(#${gradientId})`} />
        <circle cx="-57.2" cy="33" r="7" fill={`url(#${gradientId})`} />
        <circle cx="-57.2" cy="-33" r="7" fill={`url(#${gradientId})`} />
        <circle cx="0" cy="0" r="14" fill={`url(#${gradientId})`} />
        <circle
          cx="0"
          cy="0"
          r="7"
          fill={colors.core}
          fillOpacity={colors.coreOpacity}
        />
      </g>
    </svg>
  );
}
