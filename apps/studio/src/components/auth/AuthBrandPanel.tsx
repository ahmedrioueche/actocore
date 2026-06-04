import { useTranslation } from 'react-i18next';

import Logo from '@/components/ui/Logo';

export function AuthBrandPanel() {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col justify-center px-8 py-12 lg:px-14 mesh-bg text-primary-contrast overflow-hidden min-h-[220px] lg:min-h-screen lg:w-1/2">
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-6 max-w-md">
        <div className="[&_span]:text-white [&_svg]:text-white">
          <Logo />
        </div>
        <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed">
          {t('auth.brand.tagline')}
        </p>
        <p className="text-sm text-white/70 hidden lg:block">
          {t('auth.brand.subtagline')}
        </p>
      </div>
    </div>
  );
}
