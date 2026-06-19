import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { SDK_CONFIG_NAV } from '@/constants/sdk-config-nav';

function SdkConfigSectionSkeleton({
  fieldRows = 3,
  children,
}: {
  fieldRows?: number;
  children?: ReactNode;
}) {
  return (
    <div className="scroll-mt-24 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
      <div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
      </div>
      <div className="space-y-4">
        {children ??
          Array.from({ length: fieldRows }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
      </div>
    </div>
  );
}

function SdkConfigSidebarSkeleton() {
  return (
    <aside className="w-full shrink-0 md:sticky md:top-24 md:w-56 md:self-start">
      <Skeleton className="mb-2 h-3 w-24 px-1" />
      <nav className="flex gap-1 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible md:pb-0">
        {SDK_CONFIG_NAV.map((item) => (
          <div
            key={item.id}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 md:w-full"
          >
            <Skeleton className="h-4 w-4 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </nav>
      <Skeleton className="mt-4 hidden h-8 w-full md:block" />
    </aside>
  );
}

export function SdkConfigFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-xl border border-border bg-surface-secondary px-4 py-3">
        <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <SdkConfigSidebarSkeleton />
        <div className="min-w-0 flex-1">
          <SdkConfigSectionSkeleton fieldRows={0}>
            <div className="space-y-3">
              <Skeleton className="h-4 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-11 w-full max-w-xs rounded-xl" />
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </SdkConfigSectionSkeleton>
        </div>
      </div>
    </div>
  );
}
