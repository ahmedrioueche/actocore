import { AlertCircle, XCircle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';

interface ErrorComponentProps {
  error?: string;
  showIcon?: boolean;
  compact?: boolean;
  onRetry?: () => void;
}

/** Inline error state for sections, lists, and forms. */
const ErrorState: React.FC<ErrorComponentProps> = ({
  error,
  showIcon = true,
  compact = false,
  onRetry,
}) => {
  const { t } = useTranslation();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.reload();
  };

  return (
    <div className="w-full text-center flex flex-col items-center justify-center py-10 px-4">
      {showIcon ? (
        <div className={`${compact ? 'mb-4' : 'mb-6'}`}>
          <div
            className={`relative mx-auto ${compact ? 'w-20 h-20' : 'w-24 h-24'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-danger via-danger-hover to-danger rounded-full flex items-center justify-center shadow-xl shadow-danger/20">
              <XCircle
                className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} text-white`}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <h3
          className={`${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'} font-bold text-danger tracking-tight`}
        >
          {error || t('common.error')}
        </h3>

        <Button
          type="button"
          color="danger"
          icon={<AlertCircle className="h-4 w-4" />}
          onClick={handleRetry}
        >
          {t('common.retry')}
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
