import type { ReactNode } from 'react';

interface AuthFormPanelProps {
  children: ReactNode;
}

export function AuthFormPanel({ children }: AuthFormPanelProps) {
  return (
    <main className="auth-form-panel flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 md:w-1/2 md:px-8 md:py-6">
      <div className="my-auto w-full max-w-[440px] self-center">{children}</div>
    </main>
  );
}
