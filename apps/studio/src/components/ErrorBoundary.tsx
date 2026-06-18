import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { useTranslation } from 'react-i18next';

import { captureAppException } from '@/lib/sentry';
import ErrorPage from '@/pages/system/ErrorPage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    captureAppException(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorBoundaryFallback({ error }: { error: Error | null }) {
  const { t } = useTranslation();

  return (
    <ErrorPage
      subtext={error?.message ?? t('errorBoundary.message')}
      onRetry={() => window.location.reload()}
    />
  );
}

export default ErrorBoundary;
