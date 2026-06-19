import { useTranslation } from 'react-i18next';

import { findChatLocalePreset } from '@/constants/sdk-chat-locales';
import { cn } from '@/utils/helper';

interface SdkLabelLocaleTabsProps {
  locales: string[];
  activeLocale: string;
  onChange: (locale: string) => void;
  disabled?: boolean;
}

export function SdkLabelLocaleTabs({
  locales,
  activeLocale,
  onChange,
  disabled = false,
}: SdkLabelLocaleTabsProps) {
  const { t } = useTranslation();

  if (locales.length <= 1) {
    return null;
  }

  const resolveLabel = (code: string) => {
    const preset = findChatLocalePreset(code);
    return preset ? t(preset.labelKey) : code.toUpperCase();
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-text-secondary">
        {t('sdkConfig.fields.labelLocaleTabs')}
      </p>
      <div
        className="flex flex-wrap gap-1 rounded-xl bg-surface-secondary p-1"
        role="tablist"
        aria-label={t('sdkConfig.fields.labelLocaleTabs')}
      >
        {locales.map((locale) => {
          const isActive = activeLocale === locale;

          return (
            <button
              key={locale}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => onChange(locale)}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
                isActive
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {resolveLabel(locale)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
