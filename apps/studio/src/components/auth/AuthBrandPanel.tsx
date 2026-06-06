import { useTranslation } from 'react-i18next';

import { AuthBrandCodeSnippet } from '@/components/auth/AuthBrandCodeSnippet';
import { AuthBrandLogo } from '@/components/auth/AuthBrandLogo';
import { AuthFloatingBlobs } from '@/components/auth/AuthFloatingBlobs';
import type { AuthBrandVariant } from '@/components/auth/auth-panel.types';

interface AuthBrandPanelProps {
  variant?: AuthBrandVariant;
}

export function AuthBrandPanel({ variant = 'login' }: AuthBrandPanelProps) {
  const { t } = useTranslation();
  const brandKey = variant === 'signup' ? 'auth.brand.signup' : 'auth.brand';

  return (
    <section className="auth-brand-panel relative flex shrink-0 flex-col overflow-hidden px-4 py-3 text-primary-contrast md:h-full md:min-h-0 md:w-1/2 md:p-8 lg:p-16">
      <div
        className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <AuthFloatingBlobs />

      <div className="relative z-10 hidden min-h-0 flex-1 flex-col md:flex">
        <AuthBrandLogo />

        <div className="mt-8 max-w-xl shrink-0 lg:mt-10">
          <h1 className="mb-6 text-3xl font-bold leading-tight text-primary-contrast sm:text-4xl lg:text-[3rem] lg:leading-tight">
            {t(`${brandKey}.headline`)}
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-primary-contrast/90">
            {t(`${brandKey}.tagline`)}
          </p>
        </div>

        <div className="min-h-6 flex-1" aria-hidden />
      </div>

      <div className="relative z-10 md:hidden">
        <AuthBrandLogo compact />
      </div>

      <div className="relative z-10 hidden shrink-0 lg:block">
        <AuthBrandCodeSnippet variant={variant} />
      </div>
    </section>
  );
}
