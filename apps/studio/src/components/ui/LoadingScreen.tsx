import React from 'react';
import { useTranslation } from 'react-i18next';

import AnimatedLogo from './AnimatedLogo';

export interface LoadingScreenProps {
  /** `outer` = branded boot screen; `inner` = app shell background */
  type?: 'inner' | 'outer';
  message?: string;
}

/**
 * Full-viewport loading UI block. Prefer `@/pages/system/LoadingPage` for routes.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  type = 'outer',
  message,
}) => {
  const { t } = useTranslation();

  const isOuter = type === 'outer';

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 transition-colors duration-500 overflow-hidden relative ${
        isOuter
          ? 'mesh-bg text-white'
          : 'bg-background text-text-primary'
      }`}
    >
      {isOuter && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-soft-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-[100px] animate-soft-pulse"
            style={{ animationDelay: '2s' }}
          />
        </div>
      )}

      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        <div className="mb-10">
          <AnimatedLogo
            variant={isOuter ? 'onDark' : 'default'}
            animateOnce={isOuter}
          />
        </div>

        <div
          className="space-y-4 animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          <h2
            className={`text-2xl md:text-3xl font-black tracking-tighter ${
              isOuter ? 'text-white' : 'text-text-primary'
            }`}
          >
            {message || t('general.loading')}
          </h2>

          <p
            className={`text-sm md:text-base font-medium uppercase tracking-[0.2em] opacity-50 ${
              isOuter ? 'text-slate-300' : 'text-text-secondary'
            }`}
          >
            {t('general.please_wait')}
          </p>

          <div
            className={`mt-8 w-48 h-1 rounded-full overflow-hidden mx-auto ${
              isOuter ? 'bg-white/10' : 'bg-border'
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary animate-gradient-shift"
              style={{
                width: '100%',
                backgroundSize: '200% 100%',
                animation: 'loaderProgress 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loaderProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
