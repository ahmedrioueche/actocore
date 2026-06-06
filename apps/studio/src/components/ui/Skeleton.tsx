import { cn } from '@/utils/helper';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-hover', className)}
      aria-hidden
    />
  );
}
