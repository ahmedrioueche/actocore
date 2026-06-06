import { useTranslation } from 'react-i18next';

import CustomSelect from '@/components/ui/CustomSelect';
import InputField from '@/components/ui/InputField';
import {
  resolveFontFamilyFromPreset,
  resolveFontPreset,
  SDK_FONT_PRESET_CUSTOM,
  SDK_FONT_PRESETS,
} from '@/constants/sdk-theme';

interface SdkFontFieldProps {
  preset: string;
  customValue: string;
  onPresetChange: (preset: string) => void;
  onCustomChange: (value: string) => void;
  disabled?: boolean;
}

export function SdkFontField({
  preset,
  customValue,
  onPresetChange,
  onCustomChange,
  disabled = false,
}: SdkFontFieldProps) {
  const { t } = useTranslation();

  const options = SDK_FONT_PRESETS.map((option) => ({
    value: option.value,
    label: t(`sdkConfig.fields.fontPresets.${option.labelKey}`),
  }));

  return (
    <div className="space-y-4">
      <CustomSelect
        title={t('sdkConfig.fields.fontFamily')}
        options={options}
        selectedOption={preset}
        onChange={onPresetChange}
        disabled={disabled}
        showIcon={false}
      />
      <p className="text-xs text-text-secondary">
        {t('sdkConfig.fields.fontFamilyHint')}{' '}
        {t('sdkConfig.fields.fontFamilyDefault')}
      </p>
      {preset === SDK_FONT_PRESET_CUSTOM ? (
        <InputField
          label={t('sdkConfig.fields.fontFamilyCustom')}
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder={t('sdkConfig.fields.fontFamilyCustomPlaceholder')}
          disabled={disabled}
          spellCheck={false}
        />
      ) : null}
    </div>
  );
}
