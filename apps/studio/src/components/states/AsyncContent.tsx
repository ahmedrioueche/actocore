import type { ReactNode } from 'react';

import Error from '@/components/ui/Error';
import Loading from '@/components/ui/Loading';
import NoData from '@/components/ui/NoData';

interface AsyncContentProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  loadingClassName?: string;
  emptyClassName?: string;
  children?: ReactNode;
}

/**
 * Inline section states — use inside a page or card, not as a route.
 * For full-viewport loading/errors/404, use pages under `@/pages/system/`.
 */
export function AsyncContent({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRetry,
  loadingClassName = 'py-16',
  emptyClassName,
  children,
}: AsyncContentProps) {
  if (isLoading) {
    return <Loading fullScreen={false} className={loadingClassName} />;
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
      />
    );
  }

  return children;
}
