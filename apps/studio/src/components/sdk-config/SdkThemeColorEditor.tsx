import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HexColorField } from '@/components/sdk-config/HexColorField';
import {
  SDK_THEME_COLOR_DEFAULTS,
  SDK_THEME_COLOR_FIELDS,
  type SdkThemeColorVariant,
  type ThemeColorsByVariant,
} from '@/constants/sdk-theme';
import {
  type SdkAppThemesSupport,
  visibleThemeColorVariants,
} from '@/constants/sdk-app-themes';
import { cn } from '@/utils/helper';

interface SdkThemeColorEditorProps {
  appThemes: SdkAppThemesSupport;
  value: ThemeColorsByVariant;
  onChange: (value: ThemeColorsByVariant) => void;
  disabled?: boolean;
}

export function SdkThemeColorEditor({
  appThemes,
  value,
  onChange,
  disabled = false,
}: SdkThemeColorEditorProps) {
  const { t } = useTranslation();
  const visibleVariants = visibleThemeColorVariants(appThemes);
  const showTabs = visibleVariants.length > 1;
  const [activeVariant, setActiveVariant] = useState<SdkThemeColorVariant>(
    visibleVariants[0],
  );

  useEffect(() => {
    if (!visibleVariants.includes(activeVariant)) {
      setActiveVariant(visibleVariants[0]);
    }
  }, [activeVariant, visibleVariants]);

  const patchColor = (
    variant: SdkThemeColorVariant,
    token: (typeof SDK_THEME_COLOR_FIELDS)[number]['token'],
    color: string,
  ) => {
    onChange({
      ...value,
      [variant]: {
        ...value[variant],
        [token]: color,
      },
    });
  };

  const colorsHintKey =
    appThemes === 'both'
      ? 'themeColorsBothHint'
      : appThemes === 'light'
        ? 'themeColorsLightOnlyHint'
        : 'themeColorsDarkOnlyHint';

  return (
    <div className="border-t border-border pt-4">
      <div
        className={cn(
          'mb-4 flex flex-col gap-3',
          showTabs && 'sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <p className="text-sm font-medium text-text-primary">
          {t('sdkConfig.fields.colorsGroup')}
        </p>
        {showTabs ? (
          <div
            className="flex gap-1 rounded-xl bg-surface-secondary p-1"
            role="tablist"
            aria-label={t('sdkConfig.fields.colorPaletteTabs')}
          >
            {visibleVariants.map((variant) => (
              <button
                key={variant}
                type="button"
                role="tab"
                aria-selected={activeVariant === variant}
                disabled={disabled}
                onClick={() => setActiveVariant(variant)}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
                  activeVariant === variant
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                {t(`sdkConfig.fields.colorPalettes.${variant}`)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p className="mb-4 text-xs text-text-secondary">
        {t(`sdkConfig.fields.${colorsHintKey}`)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {SDK_THEME_COLOR_FIELDS.map((field) => (
          <HexColorField
            key={`${activeVariant}-${field.token}`}
            label={t(`sdkConfig.fields.themeColors.${field.token}`)}
            value={value[activeVariant][field.token]}
            defaultHint={SDK_THEME_COLOR_DEFAULTS[activeVariant][field.token]}
            onChange={(color) => patchColor(activeVariant, field.token, color)}
            disabled={disabled}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-text-secondary">
        {t('sdkConfig.fields.themeColorsHint')}
      </p>
    </div>
  );
}
