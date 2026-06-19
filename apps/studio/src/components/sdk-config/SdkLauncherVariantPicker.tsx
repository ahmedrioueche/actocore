import {
  SDK_LAUNCHER_VARIANTS,
  type SdkLauncherVariant,
} from '@ahmedrioueche/actocore-shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/helper';

interface SdkLauncherVariantPickerProps {
  value: SdkLauncherVariant;
  onChange: (variant: SdkLauncherVariant) => void;
  disabled?: boolean;
}

export function SdkLauncherVariantPicker({
  value,
  onChange,
  disabled = false,
}: SdkLauncherVariantPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-primary">
        {t('sdkConfig.fields.launcherVariant')}
      </p>
      <div className="flex flex-wrap gap-2">
        {SDK_LAUNCHER_VARIANTS.map((variant) => {
          const selected = value === variant;
          return (
            <button
              key={variant}
              type="button"
              disabled={disabled}
              onClick={() => onChange(variant)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary/10 text-text-primary'
                  : 'border-border text-text-secondary hover:border-primary/40',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              {t(`sdkConfig.fields.launcherVariants.${variant}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
