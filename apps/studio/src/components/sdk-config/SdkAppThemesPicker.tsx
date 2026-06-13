import { useTranslation } from 'react-i18next';

import {
  SDK_APP_THEMES_OPTIONS,
  SDK_CONFIG_APP_THEMES_DEFAULT,
  type SdkAppThemesSupport,
} from '@/constants/sdk-app-themes';
import { cn } from '@/utils/helper';

interface SdkAppThemesPickerProps {
  value: SdkAppThemesSupport;
  onChange: (value: SdkAppThemesSupport) => void;
  disabled?: boolean;
  className?: string;
}

export function SdkAppThemesPicker({
  value,
  onChange,
  disabled = false,
  className,
}: SdkAppThemesPickerProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-sm font-medium text-text-primary">
        {t('sdkConfig.fields.appThemes')}
      </p>
      <div
        className="flex flex-wrap gap-1 rounded-xl bg-surface-secondary p-1"
        role="tablist"
        aria-label={t('sdkConfig.fields.appThemes')}
      >
        {SDK_APP_THEMES_OPTIONS.map((option) => {
          const isActive = value === option;

          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={cn(
                'flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm',
                isActive
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {t(`sdkConfig.fields.appThemesOptions.${option}`)}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-text-secondary">
        {t('sdkConfig.fields.appThemesHint')}{' '}
        {t('sdkConfig.fields.appThemesDefault', {
          option: t(
            `sdkConfig.fields.appThemesOptions.${SDK_CONFIG_APP_THEMES_DEFAULT}`,
          ),
        })}
      </p>
    </div>
  );
}
