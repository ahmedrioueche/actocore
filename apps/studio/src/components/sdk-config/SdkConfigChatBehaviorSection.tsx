import { useTranslation } from 'react-i18next';

import { SdkConfigSection } from '@/components/sdk-config/SdkConfigSection';
import InputField from '@/components/ui/InputField';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import {
  SDK_CONFIG_COMPOSER_DEFAULTS,
  SDK_CONFIG_UI_TOGGLE_DEFAULTS,
} from '@/constants/sdk-config-defaults';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';

interface SdkConfigChatBehaviorSectionProps {
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
}

export function SdkConfigChatBehaviorSection({
  value,
  onChange,
  disabled = false,
}: SdkConfigChatBehaviorSectionProps) {
  const { t } = useTranslation();

  const patch = (partial: Partial<SdkConfigFormState>) => {
    onChange({ ...value, ...partial });
  };

  const parseRowCount = (raw: string, fallback: number): number => {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const defaultToggleHint = (enabled: boolean) =>
    t(enabled ? 'sdkConfig.fields.defaultOn' : 'sdkConfig.fields.defaultOff');

  const defaultCopyPlaceholder = (placeholder: string) =>
    t('sdkConfig.fields.defaultPlaceholder', { value: placeholder });

  return (
    <SdkConfigSection
      id="chat-behavior"
      title={t('sdkConfig.sections.chatUi.title')}
      description={t('sdkConfig.sections.chatUi.description')}
    >
      <ToggleSwitch
        checked={value.showSources}
        onChange={(showSources) => patch({ showSources })}
        disabled={disabled}
        label={t('sdkConfig.fields.showSources')}
        description={defaultToggleHint(
          SDK_CONFIG_UI_TOGGLE_DEFAULTS.showSources,
        )}
      />
      <ToggleSwitch
        checked={value.showIntentBadge}
        onChange={(showIntentBadge) => patch({ showIntentBadge })}
        disabled={disabled}
        label={t('sdkConfig.fields.showIntentBadge')}
        description={defaultToggleHint(
          SDK_CONFIG_UI_TOGGLE_DEFAULTS.showIntentBadge,
        )}
      />
      <ToggleSwitch
        checked={value.showActionsHint}
        onChange={(showActionsHint) => patch({ showActionsHint })}
        disabled={disabled}
        label={t('sdkConfig.fields.showActionsHint')}
        description={defaultToggleHint(
          SDK_CONFIG_UI_TOGGLE_DEFAULTS.showActionsHint,
        )}
      />
      <ToggleSwitch
        checked={value.showActionPicker}
        onChange={(showActionPicker) => patch({ showActionPicker })}
        disabled={disabled}
        label={t('sdkConfig.fields.showActionPicker')}
        description={defaultToggleHint(
          SDK_CONFIG_UI_TOGGLE_DEFAULTS.showActionPicker,
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('sdkConfig.fields.composerMinRows')}
          type="number"
          min={1}
          max={12}
          value={String(value.composerMinRows)}
          onChange={(e) =>
            patch({
              composerMinRows: parseRowCount(
                e.target.value,
                value.composerMinRows,
              ),
            })
          }
          disabled={disabled}
          placeholder={defaultCopyPlaceholder(
            String(SDK_CONFIG_COMPOSER_DEFAULTS.composerMinRows),
          )}
        />
        <InputField
          label={t('sdkConfig.fields.composerMaxRows')}
          type="number"
          max={12}
          min={1}
          value={String(value.composerMaxRows)}
          onChange={(e) =>
            patch({
              composerMaxRows: parseRowCount(
                e.target.value,
                value.composerMaxRows,
              ),
            })
          }
          disabled={disabled}
          placeholder={defaultCopyPlaceholder(
            String(SDK_CONFIG_COMPOSER_DEFAULTS.composerMaxRows),
          )}
        />
      </div>
      <p className="text-xs text-text-secondary">
        {t('sdkConfig.fields.composerRowsHint')}
      </p>
    </SdkConfigSection>
  );
}
