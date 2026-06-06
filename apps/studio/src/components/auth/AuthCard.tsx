import type { ReactNode } from 'react';

import { cn } from '@/utils/helper';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full max-w-md mx-auto bg-surface border border-border rounded-2xl shadow-md p-5 md:p-6',
        className,
      )}
    >
      <header className="mb-4">
        <h1 className="text-xl font-bold text-text-primary md:text-2xl">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
        )}
      </header>
      {children}
      {footer && (
        <footer className="mt-4 pt-3 border-t border-border text-sm text-text-secondary">
          {footer}
        </footer>
      )}
    </div>
  );
}
