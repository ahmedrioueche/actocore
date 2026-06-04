import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { useTranslation } from "react-i18next";
import ErrorSection from "@/components/ui/ErrorSection";

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
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // You could also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
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
    <ErrorSection
      message={t("errorBoundary.title")}
      subtext={error?.message ?? t("errorBoundary.message")}
    />
  );
}

export default ErrorBoundary;
