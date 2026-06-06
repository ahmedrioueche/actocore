import type { ReactNode } from 'react';

import { cn } from '@/utils/helper';

interface AuthGlassCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthGlassCard({ children, className }: AuthGlassCardProps) {
  return (
    <div
      className={cn(
        'auth-glass-card rounded-xl p-5 shadow-sm md:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
