import { useTranslation } from 'react-i18next';

import type { SdkThemeMode } from '@ahmedrioueche/actocore-shared';

import { ThemeModePicker } from '@/components/ui/ThemeModePicker';
import { SDK_CONFIG_THEME_MODE_DEFAULT } from '@/constants/sdk-config-defaults';

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
    <ThemeModePicker
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      label={t('sdkConfig.fields.themeMode')}
      hint={
        <>
          {t('sdkConfig.fields.themeModeHint')}{' '}
          {t('sdkConfig.fields.themeModeDefault', {
            mode: t(`theme.modes.${SDK_CONFIG_THEME_MODE_DEFAULT}`),
          })}
        </>
      }
    />
  );
}
