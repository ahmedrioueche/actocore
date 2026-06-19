import type { SdkWidgetPanelLayout } from '@ahmedrioueche/actocore-shared';
import { SDK_WIDGET_PANEL_LAYOUTS } from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/helper';

interface SdkPanelLayoutPickerProps {
  value: SdkWidgetPanelLayout;
  onChange: (value: SdkWidgetPanelLayout) => void;
  disabled?: boolean;
}

export function SdkPanelLayoutPicker({
  value,
  onChange,
  disabled = false,
}: SdkPanelLayoutPickerProps) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text-primary">
        {t('sdkConfig.fields.panelLayout')}
      </p>
      <div
        role="radiogroup"
        aria-label={t('sdkConfig.fields.panelLayout')}
        className="grid gap-2 sm:grid-cols-3"
      >
        {SDK_WIDGET_PANEL_LAYOUTS.map((layout) => {
          const selected = value === layout;
          return (
            <button
              key={layout}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(layout)}
              className={cn(
                'rounded-xl border px-3 py-3 text-left text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary/10 text-text-primary'
                  : 'border-border bg-background text-text-secondary hover:border-primary/40 hover:text-text-primary',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <span className="font-medium">
                {t(`sdkConfig.fields.panelLayoutOptions.${layout}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
