import { useTranslation } from 'react-i18next';

import { SdkAppThemesPicker } from '@/components/sdk-config/SdkAppThemesPicker';
import { SdkConfigSection } from '@/components/sdk-config/SdkConfigSection';
import { SdkFontField } from '@/components/sdk-config/SdkFontField';
import { SdkThemeColorEditor } from '@/components/sdk-config/SdkThemeColorEditor';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';

interface SdkConfigAppearanceSectionProps {
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
}

export function SdkConfigAppearanceSection({
  value,
  onChange,
  disabled = false,
}: SdkConfigAppearanceSectionProps) {
  const { t } = useTranslation();

  const patch = (partial: Partial<SdkConfigFormState>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <SdkConfigSection
      id="appearance"
      title={t('sdkConfig.sections.appearance.title')}
      description={t('sdkConfig.sections.appearance.description')}
    >
      <SdkAppThemesPicker
        value={value.appThemes}
        onChange={(appThemes) => patch({ appThemes })}
        disabled={disabled}
      />

      <SdkThemeColorEditor
        appThemes={value.appThemes}
        value={value.themeColorsByVariant}
        onChange={(themeColorsByVariant) => patch({ themeColorsByVariant })}
        disabled={disabled}
      />

      <div className="border-t border-border pt-4">
        <SdkFontField
          preset={value.fontPreset}
          customValue={value.fontCustom}
          onPresetChange={(fontPreset) => patch({ fontPreset })}
          onCustomChange={(fontCustom) => patch({ fontCustom })}
          disabled={disabled}
        />
      </div>
    </SdkConfigSection>
  );
}
