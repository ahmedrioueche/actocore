import type { ReactNode } from 'react';

import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <AuthBrandPanel />
      <div className="flex-1 flex items-center justify-center px-4 py-10 lg:py-12 bg-background">
        {children}
      </div>
    </div>
  );
}
