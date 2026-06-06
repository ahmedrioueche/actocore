import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HexColorField } from '@/components/sdk-config/HexColorField';
import {
  SDK_THEME_COLOR_DEFAULTS,
  SDK_THEME_COLOR_FIELDS,
  SDK_THEME_COLOR_VARIANTS,
  type SdkThemeColorVariant,
  type ThemeColorsByVariant,
} from '@/constants/sdk-theme';
import type { SdkThemeMode } from '@ahmedrioueche/actocore-shared';
import { cn } from '@/utils/helper';

interface SdkThemeColorEditorProps {
  themeMode: SdkThemeMode;
  value: ThemeColorsByVariant;
  onChange: (value: ThemeColorsByVariant) => void;
  disabled?: boolean;
}

function editorVariantForThemeMode(mode: SdkThemeMode): SdkThemeColorVariant {
  return mode === 'dark' ? 'dark' : 'light';
}

export function SdkThemeColorEditor({
  themeMode,
  value,
  onChange,
  disabled = false,
}: SdkThemeColorEditorProps) {
  const { t } = useTranslation();
  const [activeVariant, setActiveVariant] = useState<SdkThemeColorVariant>(
    editorVariantForThemeMode(themeMode),
  );

  useEffect(() => {
    if (themeMode === 'system') {
      return;
    }
    setActiveVariant(editorVariantForThemeMode(themeMode));
  }, [themeMode]);

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

  return (
    <div className="border-t border-border pt-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-text-primary">
          {t('sdkConfig.fields.colorsGroup')}
        </p>
        <div
          className="flex gap-1 rounded-xl bg-surface-secondary p-1"
          role="tablist"
          aria-label={t('sdkConfig.fields.colorPaletteTabs')}
        >
          {SDK_THEME_COLOR_VARIANTS.map((variant) => (
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
      </div>

      <p className="mb-4 text-xs text-text-secondary">
        {themeMode === 'system'
          ? t('sdkConfig.fields.themeColorsSystemHint')
          : t('sdkConfig.fields.themeColorsModeHint', {
              mode: t(`theme.modes.${themeMode}`),
            })}
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
