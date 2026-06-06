import { useTranslation } from 'react-i18next';

import { SdkThemeModePicker } from '@/components/sdk-config/SdkThemeModePicker';
import { SdkThemeColorEditor } from '@/components/sdk-config/SdkThemeColorEditor';
import { SdkFontField } from '@/components/sdk-config/SdkFontField';
import InputField from '@/components/ui/InputField';
import TextArea from '@/components/ui/TextArea';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import {
  SDK_CONFIG_COMPOSER_DEFAULTS,
  SDK_CONFIG_UI_TOGGLE_DEFAULTS,
} from '@/constants/sdk-config-defaults';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';

interface SdkConfigFormProps {
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
}

function ConfigSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function SdkConfigForm({
  value,
  onChange,
  disabled = false,
}: SdkConfigFormProps) {
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

  return (
    <div className="space-y-6">
      <ConfigSection
        title={t('sdkConfig.sections.appearance.title')}
        description={t('sdkConfig.sections.appearance.description')}
      >
        <SdkThemeModePicker
          value={value.themeMode}
          onChange={(themeMode) => patch({ themeMode })}
          disabled={disabled}
        />

        <SdkThemeColorEditor
          themeMode={value.themeMode}
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
      </ConfigSection>

      <ConfigSection
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
            placeholder={String(SDK_CONFIG_COMPOSER_DEFAULTS.composerMinRows)}
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
            placeholder={String(SDK_CONFIG_COMPOSER_DEFAULTS.composerMaxRows)}
          />
        </div>
        <p className="text-xs text-text-secondary">
          {t('sdkConfig.fields.composerRowsHint')}
        </p>
      </ConfigSection>

      <ConfigSection
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
          disabled={disabled}
        />
        <InputField
          label={t('sdkConfig.fields.headerSubtitle')}
          value={value.headerSubtitle}
          onChange={(e) => patch({ headerSubtitle: e.target.value })}
          disabled={disabled}
        />
        <InputField
          label={t('sdkConfig.fields.emptyTitle')}
          value={value.emptyTitle}
          onChange={(e) => patch({ emptyTitle: e.target.value })}
          disabled={disabled}
        />
        <TextArea
          label={t('sdkConfig.fields.emptyDescription')}
          value={value.emptyDescription}
          onChange={(e) => patch({ emptyDescription: e.target.value })}
          rows={3}
          disabled={disabled}
        />
        <TextArea
          label={t('sdkConfig.fields.actionsHint')}
          value={value.actionsHint}
          onChange={(e) => patch({ actionsHint: e.target.value })}
          rows={2}
          disabled={disabled}
        />
        <InputField
          label={t('sdkConfig.fields.placeholder')}
          value={value.placeholder}
          onChange={(e) => patch({ placeholder: e.target.value })}
          disabled={disabled}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t('sdkConfig.fields.send')}
            value={value.send}
            onChange={(e) => patch({ send: e.target.value })}
            disabled={disabled}
          />
          <InputField
            label={t('sdkConfig.fields.open')}
            value={value.open}
            onChange={(e) => patch({ open: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-4 text-sm font-medium text-text-primary">
            {t('sdkConfig.fields.launcherGroup')}
          </p>
          <div className="space-y-4">
            <InputField
              label={t('sdkConfig.fields.launcherIconUrl')}
              type="url"
              value={value.launcherIconUrl}
              onChange={(e) => patch({ launcherIconUrl: e.target.value })}
              placeholder={t('sdkConfig.fields.launcherIconUrlDefault')}
              disabled={disabled}
            />
            <InputField
              label={t('sdkConfig.fields.launcherAriaLabel')}
              value={value.launcherAriaLabel}
              onChange={(e) => patch({ launcherAriaLabel: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
      </ConfigSection>
    </div>
  );
}
