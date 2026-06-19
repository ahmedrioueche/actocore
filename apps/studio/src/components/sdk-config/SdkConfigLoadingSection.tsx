import {
  SDK_LOADING_INIT_STYLES,
  SDK_LOADING_TEXT_ANIMATIONS,
  SDK_LOADING_THINKING_STYLES,
} from '@ahmedrioueche/actocore-shared';
import type {
  SdkLoadingInitStyle,
  SdkLoadingTextAnimation,
  SdkLoadingThinkingStyle,
} from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import { SdkConfigSection } from '@/components/sdk-config/SdkConfigSection';
import InputField from '@/components/ui/InputField';
import {
  SDK_CONFIG_LOADING_DEFAULTS,
  SDK_CONFIG_UI_TEXT_DEFAULTS,
} from '@/constants/sdk-config-defaults';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';
import { cn } from '@/utils/helper';

interface SdkConfigLoadingSectionProps {
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
}

function EnumPicker<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  disabled,
  labelKeyPrefix,
}: {
  label: string;
  hint?: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  labelKeyPrefix: string;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text-primary">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary/10 text-text-primary'
                  : 'border-border text-text-secondary hover:border-primary/40',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              {t(`${labelKeyPrefix}.${option}`)}
            </button>
          );
        })}
      </div>
      {hint ? (
        <p className="mt-2 text-xs text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}

export function SdkConfigLoadingSection({
  value,
  onChange,
  disabled = false,
}: SdkConfigLoadingSectionProps) {
  const { t } = useTranslation();

  const patch = (partial: Partial<SdkConfigFormState>) => {
    onChange({ ...value, ...partial });
  };

  const defaultCopyPlaceholder = (placeholder: string) =>
    t('sdkConfig.fields.defaultPlaceholder', { value: placeholder });

  const thinkingIncludesText =
    value.loadingThinkingStyle === 'text' ||
    value.loadingThinkingStyle === 'text-and-dots';

  return (
    <SdkConfigSection
      id="loading"
      title={t('sdkConfig.sections.loading.title')}
      description={t('sdkConfig.sections.loading.description')}
    >
      <EnumPicker<SdkLoadingInitStyle>
        label={t('sdkConfig.fields.loadingInitStyle')}
        hint={t('sdkConfig.fields.loadingInitStyleHint')}
        options={SDK_LOADING_INIT_STYLES}
        value={value.loadingInitStyle}
        onChange={(loadingInitStyle) => patch({ loadingInitStyle })}
        disabled={disabled}
        labelKeyPrefix="sdkConfig.fields.loadingInitStyles"
      />

      <InputField
        label={t('sdkConfig.fields.loadingText')}
        value={value.loadingText}
        onChange={(e) => patch({ loadingText: e.target.value })}
        placeholder={defaultCopyPlaceholder(
          SDK_CONFIG_UI_TEXT_DEFAULTS.loading,
        )}
        disabled={disabled}
      />

      <EnumPicker<SdkLoadingThinkingStyle>
        label={t('sdkConfig.fields.loadingThinkingStyle')}
        hint={t('sdkConfig.fields.loadingThinkingStyleHint')}
        options={SDK_LOADING_THINKING_STYLES}
        value={value.loadingThinkingStyle}
        onChange={(loadingThinkingStyle) => patch({ loadingThinkingStyle })}
        disabled={disabled}
        labelKeyPrefix="sdkConfig.fields.loadingThinkingStyles"
      />

      {thinkingIncludesText ? (
        <EnumPicker<SdkLoadingTextAnimation>
          label={t('sdkConfig.fields.loadingThinkingAnimation')}
          options={SDK_LOADING_TEXT_ANIMATIONS}
          value={value.loadingThinkingAnimation}
          onChange={(loadingThinkingAnimation) =>
            patch({ loadingThinkingAnimation })
          }
          disabled={disabled}
          labelKeyPrefix="sdkConfig.fields.loadingThinkingAnimations"
        />
      ) : null}

      {thinkingIncludesText ? (
        <InputField
          label={t('sdkConfig.fields.thinkingText')}
          value={value.thinkingText}
          onChange={(e) => patch({ thinkingText: e.target.value })}
          placeholder={defaultCopyPlaceholder(
            SDK_CONFIG_UI_TEXT_DEFAULTS.thinking,
          )}
          disabled={disabled}
        />
      ) : null}
    </SdkConfigSection>
  );
}
