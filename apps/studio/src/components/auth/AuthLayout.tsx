import type { ReactNode } from 'react';

import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { AuthFormPanel } from '@/components/auth/AuthFormPanel';
import type { AuthBrandVariant } from '@/components/auth/auth-panel.types';

interface AuthLayoutProps {
  children: ReactNode;
  brandVariant?: AuthBrandVariant;
}

export function AuthLayout({
  children,
  brandVariant = 'login',
}: AuthLayoutProps) {
  return (
    <div className="auth-shell flex w-full flex-col md:flex-row">
      <AuthBrandPanel variant={brandVariant} />
      <AuthFormPanel>{children}</AuthFormPanel>
    </div>
  );
}
