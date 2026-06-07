import { Monitor, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/helper';

export type ThemeModeValue = 'light' | 'dark' | 'system';

const THEME_MODES: ThemeModeValue[] = ['light', 'dark', 'system'];

const MODE_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

interface ThemeModePickerProps {
  value: ThemeModeValue;
  onChange: (mode: ThemeModeValue) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  hint?: ReactNode;
  size?: 'default' | 'compact';
}

export function ThemeModePicker({
  value,
  onChange,
  disabled = false,
  className,
  label,
  hint,
  size = 'default',
}: ThemeModePickerProps) {
  const { t } = useTranslation();
  const ariaLabel = label ?? t('theme.label');
  const iconClass = size === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const buttonClass =
    size === 'compact'
      ? 'px-2 py-2 text-xs'
      : 'px-2 py-2.5 text-xs sm:text-sm';

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <p
          className={cn(
            'font-medium text-text-primary',
            size === 'compact'
              ? 'px-1 text-xs font-semibold uppercase tracking-wide text-text-secondary'
              : 'text-sm',
          )}
        >
          {label}
        </p>
      ) : null}
      <div
        className="flex gap-1 rounded-xl bg-surface-secondary p-1"
        role="group"
        aria-label={ariaLabel}
      >
        {THEME_MODES.map((mode) => {
          const Icon = MODE_ICONS[mode];
          const isActive = value === mode;

          return (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              onClick={() => onChange(mode)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
                buttonClass,
                isActive
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
                disabled && 'cursor-not-allowed opacity-50',
              )}
              aria-pressed={isActive}
              title={t(`theme.modes.${mode}`)}
            >
              <Icon className={cn(iconClass, 'shrink-0')} aria-hidden />
              <span>{t(`theme.modes.${mode}`)}</span>
            </button>
          );
        })}
      </div>
      {hint ? (
        <p className="text-xs leading-relaxed text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}
