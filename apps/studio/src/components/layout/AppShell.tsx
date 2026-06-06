import type { ReactNode } from 'react';

interface AppShellProps {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

/** Authenticated app chrome — header + scrollable main area. */
export default function AppShell({
  title,
  subtitle,
  headerActions,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-text-secondary">{subtitle}</p>
          ) : null}
        </div>
        {headerActions ? (
          <div className="flex items-center gap-3">{headerActions}</div>
        ) : null}
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
