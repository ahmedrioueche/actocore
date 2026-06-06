import { AlertCircle, XCircle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';

interface ErrorSectionProps {
  message: string;
  icon?: React.ReactNode;
  subtext?: string;
  fullPage?: boolean;
  onRetry?: () => void;
}

/** Full-viewport error UI — use ErrorPage for routes. */
const ErrorSection: React.FC<ErrorSectionProps> = ({
  message,
  icon,
  subtext,
  fullPage = true,
  onRetry,
}) => {
  const { t } = useTranslation();

  const layoutClass = fullPage ? 'min-h-screen' : 'py-16 md:py-24';
  const decorationPosition = fullPage ? 'fixed' : 'absolute';

  const handleAction = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    window.history.back();
  };

  return (
    <div
      className={`relative ${layoutClass} bg-background text-text-primary flex flex-col items-center justify-center px-4`}
    >
      <div className="max-w-xl w-full text-center relative z-10">
        <div className="mb-8">
          {icon || (
            <div className="relative mx-auto w-32 h-32 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-danger via-danger-hover to-danger rounded-full flex items-center justify-center shadow-2xl shadow-danger/25">
                <XCircle className="w-12 h-12 text-white" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-danger mb-4 tracking-tight">
            {message}
          </h2>

          {subtext ? (
            <p className="text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
              {subtext}
            </p>
          ) : null}

          <div className="mt-8">
            <Button
              type="button"
              color="danger"
              icon={<AlertCircle className="h-4 w-4" />}
              onClick={handleAction}
            >
              {onRetry ? t('common.retry') : t('common.goBack')}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={`${decorationPosition} inset-0 pointer-events-none overflow-hidden -z-10`}
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-danger/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-danger/5 to-transparent rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default ErrorSection;
