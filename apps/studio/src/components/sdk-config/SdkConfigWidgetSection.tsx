import { SDK_PRESENTATION_MODES } from '@ahmedrioueche/actocore-shared';
import type { SdkPresentationMode } from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import { SdkConfigSection } from '@/components/sdk-config/SdkConfigSection';
import { SdkHostLauncherSnippet } from '@/components/sdk-config/SdkHostLauncherSnippet';
import { SdkLauncherPlacementPicker } from '@/components/sdk-config/SdkLauncherPlacementPicker';
import { SdkLauncherPositionPicker } from '@/components/sdk-config/SdkLauncherPositionPicker';
import { SdkLauncherVariantPicker } from '@/components/sdk-config/SdkLauncherVariantPicker';
import { SdkPanelLayoutPicker } from '@/components/sdk-config/SdkPanelLayoutPicker';
import { SdkWidgetPreview } from '@/components/sdk-config/SdkWidgetPreview';
import InputField from '@/components/ui/InputField';
import {
  SDK_CONFIG_LAUNCHER_DEFAULTS,
  SDK_CONFIG_PRESENTATION_DEFAULT,
  SDK_CONFIG_UI_TEXT_DEFAULTS,
  SDK_CONFIG_WIDGET_DEFAULTS,
} from '@/constants/sdk-config-defaults';
import type { SdkConfigFormState } from '@/utils/sdk-config-form';
import { cn } from '@/utils/helper';
import type { SdkProjectConfigData } from '@ahmedrioueche/actocore-shared';

interface SdkConfigWidgetSectionProps {
  value: SdkConfigFormState;
  onChange: (value: SdkConfigFormState) => void;
  disabled?: boolean;
  savedConfig?: SdkProjectConfigData;
}

const PANEL_WIDTH_PRESETS = ['24rem', '32rem', '40rem'] as const;

export function SdkConfigWidgetSection({
  value,
  onChange,
  disabled = false,
  savedConfig,
}: SdkConfigWidgetSectionProps) {
  const { t } = useTranslation();

  const patch = (partial: Partial<SdkConfigFormState>) => {
    onChange({ ...value, ...partial });
  };

  const defaultCopyPlaceholder = (placeholder: string) =>
    t('sdkConfig.fields.defaultPlaceholder', { value: placeholder });

  const isHostLauncher = value.launcherPlacement === 'host';
  const showLauncherLabel =
    value.launcherVariant === 'button' || value.launcherVariant === 'link';

  return (
    <SdkConfigSection
      id="widget"
      title={t('sdkConfig.sections.widget.title')}
      description={t('sdkConfig.sections.widget.description')}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">
          {t('sdkConfig.fields.presentation')}
        </p>
        <div className="flex flex-wrap gap-2">
          {SDK_PRESENTATION_MODES.map((mode) => {
            const selected =
              (value.presentation || SDK_CONFIG_PRESENTATION_DEFAULT) === mode;
            return (
              <button
                key={mode}
                type="button"
                disabled={disabled}
                onClick={() =>
                  patch({ presentation: mode as SdkPresentationMode })
                }
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-text-primary'
                    : 'border-border text-text-secondary hover:border-primary/40',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                {t(`sdkConfig.fields.presentationOptions.${mode}`)}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {t('sdkConfig.fields.presentationHint')}
        </p>
      </div>

      {value.presentation === 'inline' ? (
        <p className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-secondary">
          {t('sdkConfig.sections.widget.inlineRedirect')}
        </p>
      ) : (
        <>
          <SdkWidgetPreview value={value} savedConfig={savedConfig} />

          <SdkPanelLayoutPicker
            value={value.panelLayout}
            onChange={(panelLayout) => patch({ panelLayout })}
            disabled={disabled}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-text-primary">
              {t('sdkConfig.fields.panelWidth')}
            </p>
            <div className="flex flex-wrap gap-2">
              {PANEL_WIDTH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  onClick={() => patch({ panelWidth: preset })}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm',
                    value.panelWidth === preset
                      ? 'border-primary bg-primary/10 text-text-primary'
                      : 'border-border text-text-secondary hover:border-primary/40',
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <InputField
              className="mt-3"
              label={t('sdkConfig.fields.panelWidthCustom')}
              value={value.panelWidth}
              onChange={(e) => patch({ panelWidth: e.target.value })}
              placeholder={defaultCopyPlaceholder(
                SDK_CONFIG_WIDGET_DEFAULTS.panelWidth,
              )}
              disabled={disabled}
            />
          </div>

          <InputField
            label={t('sdkConfig.fields.panelHeight')}
            value={value.panelHeight}
            onChange={(e) => patch({ panelHeight: e.target.value })}
            placeholder={t('sdkConfig.fields.panelHeightDefault')}
            disabled={disabled}
          />

          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-sm font-medium text-text-primary">
              {t('sdkConfig.fields.launcherGroup')}
            </p>

            <SdkLauncherPlacementPicker
              value={value.launcherPlacement}
              onChange={(launcherPlacement) => patch({ launcherPlacement })}
              disabled={disabled}
            />

            {isHostLauncher ? (
              <>
                <SdkLauncherVariantPicker
                  value={value.launcherVariant}
                  onChange={(launcherVariant) => patch({ launcherVariant })}
                  disabled={disabled}
                />
                {showLauncherLabel ? (
                  <InputField
                    label={t('sdkConfig.fields.launcherLabel')}
                    value={value.launcherLabel}
                    onChange={(e) => patch({ launcherLabel: e.target.value })}
                    placeholder={defaultCopyPlaceholder(
                      SDK_CONFIG_UI_TEXT_DEFAULTS.open,
                    )}
                    disabled={disabled}
                  />
                ) : null}
                <SdkHostLauncherSnippet />
              </>
            ) : (
              <SdkLauncherPositionPicker
                value={value.launcherPosition}
                onChange={(launcherPosition) => patch({ launcherPosition })}
                disabled={disabled}
              />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder={defaultCopyPlaceholder(
                  SDK_CONFIG_UI_TEXT_DEFAULTS.launcherAriaLabel,
                )}
                disabled={disabled}
              />
            </div>
            <p className="text-xs text-text-secondary">
              {t('sdkConfig.fields.launcherAriaLabelHint')}
            </p>

            {!isHostLauncher ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t('sdkConfig.fields.launcherOffsetX')}
                  value={value.launcherOffsetX}
                  onChange={(e) => patch({ launcherOffsetX: e.target.value })}
                  placeholder={defaultCopyPlaceholder(
                    SDK_CONFIG_WIDGET_DEFAULTS.offsetX,
                  )}
                  disabled={disabled}
                />
                <InputField
                  label={t('sdkConfig.fields.launcherOffsetY')}
                  value={value.launcherOffsetY}
                  onChange={(e) => patch({ launcherOffsetY: e.target.value })}
                  placeholder={defaultCopyPlaceholder(
                    SDK_CONFIG_WIDGET_DEFAULTS.offsetY,
                  )}
                  disabled={disabled}
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t('sdkConfig.fields.widgetZIndex')}
              type="number"
              min={1}
              value={value.widgetZIndex}
              onChange={(e) => patch({ widgetZIndex: e.target.value })}
              placeholder={t('sdkConfig.fields.widgetZIndexDefault')}
              disabled={disabled}
            />
            <InputField
              label={t('sdkConfig.fields.hideWhenSelector')}
              value={value.hideWhenSelector}
              onChange={(e) => patch({ hideWhenSelector: e.target.value })}
              placeholder={t('sdkConfig.fields.hideWhenSelectorPlaceholder')}
              disabled={disabled}
            />
          </div>
        </>
      )}
    </SdkConfigSection>
  );
}

