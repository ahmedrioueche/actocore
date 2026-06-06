import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { SdkThemeMode } from '@ahmedrioueche/actocore-shared';

import { SDK_CONFIG_THEME_MODE_DEFAULT } from '@/constants/sdk-config-defaults';
import { cn } from '@/utils/helper';

const THEME_MODES: SdkThemeMode[] = ['light', 'dark', 'system'];

const MODE_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

interface SdkThemeModePickerProps {
  value: SdkThemeMode;
  onChange: (mode: SdkThemeMode) => void;
  disabled?: boolean;
  className?: string;
}

export function SdkThemeModePicker({
  value,
  onChange,
  disabled = false,
  className,
}: SdkThemeModePickerProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-sm font-medium text-text-primary">
        {t('sdkConfig.fields.themeMode')}
      </p>
      <div
        className="flex gap-1 rounded-xl bg-surface-secondary p-1"
        role="group"
        aria-label={t('sdkConfig.fields.themeMode')}
      >
        {THEME_MODES.map((mode) => {
          const Icon = MODE_ICONS[mode];
          const isActive = value === mode;

          return (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              onClick={() => onChange(mode)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium transition-colors sm:text-sm',
                isActive
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
                disabled && 'cursor-not-allowed opacity-50',
              )}
              aria-pressed={isActive}
              title={t(`theme.modes.${mode}`)}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{t(`theme.modes.${mode}`)}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-text-secondary">
        {t('sdkConfig.fields.themeModeHint')}{' '}
        {t('sdkConfig.fields.themeModeDefault', {
          mode: t(`theme.modes.${SDK_CONFIG_THEME_MODE_DEFAULT}`),
        })}
      </p>
    </div>
  );
}
