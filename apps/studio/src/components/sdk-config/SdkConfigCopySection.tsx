import { useTranslation } from 'react-i18next';

import { SdkConfigSection } from '@/components/sdk-config/SdkConfigSection';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import {
  SDK_CONFIG_UI_TEXT_DEFAULTS,
} from '@/constants/sdk-config-defaults';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';

interface SdkConfigCopySectionProps {
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
}

export function SdkConfigCopySection({
  value,
  onChange,
  disabled = false,
}: SdkConfigCopySectionProps) {
  const { t } = useTranslation();

  const patch = (partial: Partial<SdkConfigFormState>) => {
    onChange({ ...value, ...partial });
  };

  const defaultCopyPlaceholder = (placeholder: string) =>
    t('sdkConfig.fields.defaultPlaceholder', { value: placeholder });

  return (
    <SdkConfigSection
      id="copy"
      title={t('sdkConfig.sections.copyLauncher.title')}
      description={t('sdkConfig.sections.copyLauncher.description')}
    >
      <p className="text-xs text-text-secondary">
        {t('sdkConfig.fields.copyLauncherHint')}
      </p>
      <InputField
        label={t('sdkConfig.fields.headerTitle')}
        value={value.headerTitle}
        onChange={(e) => patch({ headerTitle: e.target.value })}
        placeholder={defaultCopyPlaceholder(
          SDK_CONFIG_UI_TEXT_DEFAULTS.headerTitle,
        )}
        disabled={disabled}
      />
      <InputField
        label={t('sdkConfig.fields.headerSubtitle')}
        value={value.headerSubtitle}
        onChange={(e) => patch({ headerSubtitle: e.target.value })}
        placeholder={defaultCopyPlaceholder(
          SDK_CONFIG_UI_TEXT_DEFAULTS.headerSubtitle,
        )}
        disabled={disabled}
      />
      <ToggleSwitch
        checked={value.showHeaderIcon}
        onChange={(showHeaderIcon) => patch({ showHeaderIcon })}
        disabled={disabled}
        label={t('sdkConfig.fields.showHeaderIcon')}
        description={t(
          value.showHeaderIcon
            ? 'sdkConfig.fields.showHeaderIconOnHint'
            : 'sdkConfig.fields.showHeaderIconOffHint',
        )}
      />
      {value.showHeaderIcon ? (
        <InputField
          label={t('sdkConfig.fields.headerIconUrl')}
          value={value.headerIconUrl}
          onChange={(e) => patch({ headerIconUrl: e.target.value })}
          placeholder={t('sdkConfig.fields.headerIconUrlDefault')}
          disabled={disabled}
        />
      ) : null}
      <InputField
        label={t('sdkConfig.fields.emptyTitle')}
        value={value.emptyTitle}
        onChange={(e) => patch({ emptyTitle: e.target.value })}
        placeholder={defaultCopyPlaceholder(
          SDK_CONFIG_UI_TEXT_DEFAULTS.emptyTitle,
        )}
        disabled={disabled}
      />
      <TextArea
        label={t('sdkConfig.fields.emptyDescription')}
        value={value.emptyDescription}
        onChange={(e) => patch({ emptyDescription: e.target.value })}
        placeholder={defaultCopyPlaceholder(
          SDK_CONFIG_UI_TEXT_DEFAULTS.emptyDescription,
        )}
        rows={3}
        disabled={disabled}
      />
      <TextArea
        label={t('sdkConfig.fields.actionsHint')}
        value={value.actionsHint}
        onChange={(e) => patch({ actionsHint: e.target.value })}
        placeholder={defaultCopyPlaceholder(
          SDK_CONFIG_UI_TEXT_DEFAULTS.actionsHint,
        )}
        rows={2}
        disabled={disabled}
      />
      <InputField
        label={t('sdkConfig.fields.placeholder')}
        value={value.placeholder}
        onChange={(e) => patch({ placeholder: e.target.value })}
        placeholder={defaultCopyPlaceholder(
          SDK_CONFIG_UI_TEXT_DEFAULTS.placeholder,
        )}
        disabled={disabled}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('sdkConfig.fields.send')}
          value={value.send}
          onChange={(e) => patch({ send: e.target.value })}
          placeholder={defaultCopyPlaceholder(SDK_CONFIG_UI_TEXT_DEFAULTS.send)}
          disabled={disabled}
        />
        <InputField
          label={t('sdkConfig.fields.stop')}
          value={value.stop}
          onChange={(e) => patch({ stop: e.target.value })}
          placeholder={defaultCopyPlaceholder(SDK_CONFIG_UI_TEXT_DEFAULTS.stop)}
          disabled={disabled}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={t('sdkConfig.fields.newConversation')}
          value={value.newConversation}
          onChange={(e) => patch({ newConversation: e.target.value })}
          placeholder={defaultCopyPlaceholder(
            SDK_CONFIG_UI_TEXT_DEFAULTS.newConversation,
          )}
          disabled={disabled}
        />
        <InputField
          label={t('sdkConfig.fields.minimize')}
          value={value.minimize}
          onChange={(e) => patch({ minimize: e.target.value })}
          placeholder={defaultCopyPlaceholder(
            SDK_CONFIG_UI_TEXT_DEFAULTS.minimize,
          )}
          disabled={disabled}
        />
      </div>
    </SdkConfigSection>
  );
}
