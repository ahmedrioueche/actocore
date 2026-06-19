import { useTranslation } from 'react-i18next';

import { SdkConfigSection } from '@/components/sdk-config/SdkConfigSection';
import InputField from '@/components/ui/InputField';
import { SDK_CONFIG_INLINE_DEFAULTS } from '@/constants/sdk-config-defaults';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';

interface SdkConfigInlineSectionProps {
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
}

export function SdkConfigInlineSection({
  value,
  onChange,
  disabled = false,
}: SdkConfigInlineSectionProps) {
  const { t } = useTranslation();

  const patch = (partial: Partial<SdkConfigFormState>) => {
    onChange({ ...value, ...partial });
  };

  const defaultCopyPlaceholder = (placeholder: string) =>
    t('sdkConfig.fields.defaultPlaceholder', { value: placeholder });

  const snippet = `<div style={{ height: '${value.inlineHeight || SDK_CONFIG_INLINE_DEFAULTS.height}' }}>
  <ActoChat />
</div>`;

  return (
    <SdkConfigSection
      id="inline"
      title={t('sdkConfig.sections.inline.title')}
      description={t('sdkConfig.sections.inline.description')}
    >
      <p className="text-sm text-text-secondary">
        {t('sdkConfig.sections.inline.integrationHint')}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('sdkConfig.fields.inlineMaxWidth')}
          value={value.inlineMaxWidth}
          onChange={(e) => patch({ inlineMaxWidth: e.target.value })}
          placeholder={defaultCopyPlaceholder(
            SDK_CONFIG_INLINE_DEFAULTS.maxWidth,
          )}
          disabled={disabled}
        />
        <InputField
          label={t('sdkConfig.fields.inlineMinHeight')}
          value={value.inlineMinHeight}
          onChange={(e) => patch({ inlineMinHeight: e.target.value })}
          placeholder={defaultCopyPlaceholder(
            SDK_CONFIG_INLINE_DEFAULTS.minHeight,
          )}
          disabled={disabled}
        />
      </div>

      <InputField
        label={t('sdkConfig.fields.inlineHeight')}
        value={value.inlineHeight}
        onChange={(e) => patch({ inlineHeight: e.target.value })}
        placeholder={defaultCopyPlaceholder(SDK_CONFIG_INLINE_DEFAULTS.height)}
        disabled={disabled}
      />

      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">
          {t('sdkConfig.sections.inline.snippetTitle')}
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border bg-background p-4 text-xs text-text-secondary">
          {snippet}
        </pre>
      </div>
    </SdkConfigSection>
  );
}
