import { useTranslation } from 'react-i18next';

export function AuthDivider() {
  const { t } = useTranslation();
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-surface px-2 text-text-secondary">
          {t('auth.or')}
        </span>
      </div>
    </div>
  );
}
