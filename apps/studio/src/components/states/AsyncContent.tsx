import type { ReactNode } from 'react';

import Error from '@/components/ui/Error';
import NoData from '@/components/ui/NoData';

import { PageSkeleton, type PageSkeletonVariant } from './PageSkeleton';

interface AsyncContentProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  loadingClassName?: string;
  loadingVariant?: PageSkeletonVariant;
  emptyClassName?: string;
  children?: ReactNode;
}

function renderBody({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRetry,
  loadingClassName,
  loadingVariant,
  emptyClassName,
  children,
}: AsyncContentProps) {
  if (isLoading) {
    return (
      <PageSkeleton
        variant={loadingVariant}
        showHeader={false}
        className={loadingClassName}
      />
    );
  }

  if (isError) {
    return <Error error={error} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <NoData
        title={emptyTitle}
        description={emptyDescription}
        className={emptyClassName}
        centered={false}
      />
    );
  }

  return children;
}

/**
 * Inline dynamic section states — pair with a static `PageHeader` (or shell) above.
 * For full-viewport boot loading, use `@/pages/system/LoadingPage`.
 */
export function AsyncContent(props: AsyncContentProps) {
  return renderBody(props);
}
