import {
  SDK_LAUNCHER_PLACEMENTS,
  type SdkLauncherPlacement,
} from '@ahmedrioueche/actocore-shared';
import { LayoutTemplate, MousePointerClick } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/helper';

const PLACEMENT_META: Record<
  SdkLauncherPlacement,
  { icon: typeof MousePointerClick; labelKey: string; hintKey: string }
> = {
  floating: {
    icon: MousePointerClick,
    labelKey: 'sdkConfig.fields.launcherPlacements.floating',
    hintKey: 'sdkConfig.fields.launcherPlacementFloatingHint',
  },
  host: {
    icon: LayoutTemplate,
    labelKey: 'sdkConfig.fields.launcherPlacements.host',
    hintKey: 'sdkConfig.fields.launcherPlacementHostHint',
  },
};

interface SdkLauncherPlacementPickerProps {
  value: SdkLauncherPlacement;
  onChange: (placement: SdkLauncherPlacement) => void;
  disabled?: boolean;
}

export function SdkLauncherPlacementPicker({
  value,
  onChange,
  disabled = false,
}: SdkLauncherPlacementPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-primary">
        {t('sdkConfig.fields.launcherPlacement')}
      </p>
      <div className="flex flex-wrap gap-2">
        {SDK_LAUNCHER_PLACEMENTS.map((placement) => {
          const selected = value === placement;
          const Icon = PLACEMENT_META[placement].icon;
          return (
            <button
              key={placement}
              type="button"
              disabled={disabled}
              onClick={() => onChange(placement)}
              className={cn(
                'flex min-w-[9rem] flex-1 items-start gap-2 rounded-xl border px-3 py-3 text-left transition-colors sm:max-w-xs',
                selected
                  ? 'border-primary bg-primary/10 text-text-primary'
                  : 'border-border text-text-secondary hover:border-primary/40',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                <span className="block text-sm font-medium">
                  {t(PLACEMENT_META[placement].labelKey)}
                </span>
                <span className="mt-1 block text-xs text-text-secondary">
                  {t(PLACEMENT_META[placement].hintKey)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
