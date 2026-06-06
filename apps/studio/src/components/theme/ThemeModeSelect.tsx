import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { cn } from '@/utils/helper';

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];

const MODE_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

interface ThemeModeSelectProps {
  id?: string;
  variant?: 'field' | 'inline';
  className?: string;
}

export function ThemeModeSelect({
  id = 'theme-mode',
  variant = 'field',
  className,
}: ThemeModeSelectProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  if (variant === 'inline') {
    return (
      <div
        className={cn('px-2 py-1', className)}
        role="group"
        aria-label={t('theme.label')}
      >
        <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {t('theme.label')}
        </p>
        <div className="flex gap-1 rounded-xl bg-surface-secondary p-1">
          {THEME_MODES.map((mode) => {
            const Icon = MODE_ICONS[mode];
            const isActive = theme === mode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                )}
                aria-pressed={isActive}
                title={t(`theme.modes.${mode}`)}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{t(`theme.modes.${mode}`)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-text-primary"
      >
        {t('theme.label')}
      </label>
      <select
        id={id}
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeMode)}
        className="onboarding-select block w-full rounded-xl border border-border bg-surface py-3 pl-3 pr-10 text-sm text-text-primary transition-all duration-200 hover:border-primary/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {THEME_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {t(`theme.modes.${mode}`)}
          </option>
        ))}
      </select>
      <p className="text-xs leading-relaxed text-text-secondary">
        {t('theme.hint')}
      </p>
    </div>
  );
}
