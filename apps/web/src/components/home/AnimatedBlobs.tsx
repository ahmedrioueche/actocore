import { cn } from '@/lib/utils';

type AnimatedBlobsProps = {
  className?: string;
};

export function AnimatedBlobs({ className }: AnimatedBlobsProps) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="animated-blob absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary-muted" />
      <div
        className="animated-blob absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-surface-secondary"
        style={{ animationDelay: '-5s' }}
      />
    </div>
  );
}
