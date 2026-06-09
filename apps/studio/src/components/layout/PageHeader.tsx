import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col items-center gap-4 text-center md:mb-8 md:flex-row md:items-start md:justify-between md:text-start">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-text-secondary md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-2 md:w-auto md:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
