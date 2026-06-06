import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AuthSecurityBadge() {
  const { t } = useTranslation();

  return (
    <div className="mt-12 flex items-center justify-center gap-2 opacity-40 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
      <ShieldCheck className="h-[18px] w-[18px] text-text-secondary" aria-hidden />
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
        {t('auth.securityBadge')}
      </span>
    </div>
  );
}
