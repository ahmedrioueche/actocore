import { useTranslation } from 'react-i18next';

interface AuthDividerProps {
  /** i18n key for center label; defaults to `auth.or` */
  labelKey?: string;
}

export function AuthDivider({ labelKey = 'auth.or' }: AuthDividerProps) {
  const { t } = useTranslation();

  return (
    <div className="relative my-5">
      <div aria-hidden className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-[var(--ac-auth-glass-bg)] px-3 text-xs font-medium text-muted">
          {t(labelKey)}
        </span>
      </div>
    </div>
  );
}
