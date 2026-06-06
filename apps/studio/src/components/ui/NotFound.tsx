import { Link } from '@tanstack/react-router';
import { ArrowLeft, Home } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/components/ui/Button';

interface NotFoundProps {
  text?: string;
  icon?: React.ReactNode;
  subtext?: string;
  className?: string;
  /** Full viewport layout for route-level 404. */
  fullPage?: boolean;
  homeTo?: string;
}

/** Inline or full-page “not found” block — use NotFoundPage for routes. */
const NotFound: React.FC<NotFoundProps> = ({
  text,
  icon,
  subtext,
  className = '',
  fullPage = false,
  homeTo = '/projects',
}) => {
  const { t } = useTranslation();

  const displayText = text || t('general.page_not_found');
  const displaySubtext = subtext || t('general.page_not_found_desc');
  const layoutClass = fullPage
    ? 'min-h-screen'
    : 'py-16 md:py-24';
  const decorationPosition = fullPage ? 'fixed' : 'absolute';

  return (
    <div
      className={`relative ${layoutClass} bg-background text-text-primary flex items-center justify-center px-4 ${className}`}
    >
      <div className="max-w-xl w-full text-center relative z-10">
        <div className="mb-8">
          {icon || (
            <div className="relative mx-auto w-32 h-32 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-2xl shadow-primary/20">
                <span className="text-4xl font-bold text-white">404</span>
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-secondary rounded-full animate-pulse opacity-80 shadow-lg" />
              <div
                className="absolute -bottom-3 -left-3 w-6 h-6 bg-accent rounded-full animate-pulse opacity-70 shadow-md"
                style={{ animationDelay: '0.5s' }}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 tracking-tight">
            {displayText}
          </h2>

          {displaySubtext ? (
            <p className="text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
              {displaySubtext}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => window.history.back()}
            >
              {t('actions.go_back')}
            </Button>
            <Link to={homeTo} className="inline-flex">
              <Button
                type="button"
                icon={<Home className="h-4 w-4" />}
              >
                {t('actions.go_home')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`${decorationPosition} inset-0 pointer-events-none overflow-hidden -z-10`}
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-secondary/5 to-transparent rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default NotFound;
