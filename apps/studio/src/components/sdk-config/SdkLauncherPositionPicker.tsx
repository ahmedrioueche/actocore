import { useTranslation } from 'react-i18next';

import type { SdkWidgetPosition } from '@ahmedrioueche/actocore-shared';

import { cn } from '@/utils/helper';

const POSITIONS: SdkWidgetPosition[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

interface SdkLauncherPositionPickerProps {
  value: SdkWidgetPosition;
  onChange: (position: SdkWidgetPosition) => void;
  disabled?: boolean;
}

export function SdkLauncherPositionPicker({
  value,
  onChange,
  disabled = false,
}: SdkLauncherPositionPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-text-primary">
        {t('sdkConfig.fields.launcherPosition')}
      </p>
      <p className="text-xs text-text-secondary">
        {t('sdkConfig.fields.launcherPositionHint')}
      </p>
      <div
        className="grid max-w-xs grid-cols-2 gap-2"
        role="radiogroup"
        aria-label={t('sdkConfig.fields.launcherPosition')}
      >
        {POSITIONS.map((position) => {
          const selected = value === position;
          return (
            <button
              key={position}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(position)}
              className={cn(
                'relative flex h-20 flex-col justify-between rounded-xl border p-3 text-left transition-colors',
                selected
                  ? 'border-primary bg-primary-muted shadow-sm'
                  : 'border-border bg-surface hover:border-primary/40',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <span
                className={cn(
                  'h-3 w-3 rounded-full bg-primary',
                  position === 'top-left' && 'self-start',
                  position === 'top-right' && 'self-end',
                  position === 'bottom-left' && 'mt-auto self-start',
                  position === 'bottom-right' && 'mt-auto self-end',
                )}
                aria-hidden
              />
              <span className="text-xs font-medium text-text-primary">
                {t(`sdkConfig.fields.launcherPositions.${position}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
