import type { ReactNode } from 'react';

import { cn } from '@/utils/helper';

interface AuthFormPanelProps {
  children: ReactNode;
  /** Inner content max width — auth forms default to 440px. */
  maxWidthClass?: string;
  /** Vertical placement within the scrollable panel. */
  align?: 'center' | 'start';
}

export function AuthFormPanel({
  children,
  maxWidthClass = 'max-w-[440px]',
  align = 'center',
}: AuthFormPanelProps) {
  return (
    <main className="auth-form-panel flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 md:w-1/2 md:px-10 md:py-8 lg:px-12">
      <div
        className={cn(
          'w-full self-center',
          maxWidthClass,
          align === 'center'
            ? 'my-auto'
            : 'py-2 md:py-6 lg:py-10',
        )}
      >
        {children}
      </div>
    </main>
  );
}
