import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useT } from '@/i18n/useT';

import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useT('theme');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn('h-9 w-[7.5rem] rounded-xl bg-surface-secondary', className)}
        aria-hidden
      />
    );
  }

  const active = theme || 'system';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1',
        className,
      )}
      role="group"
      aria-label={t('system')}
    >
      {MODES.map((mode) => {
        const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
        const isActive = active === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
              isActive
                ? 'bg-primary text-primary-contrast'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
            )}
            aria-pressed={isActive}
            aria-label={t(mode)}
            title={t(mode)}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
      <span className="sr-only">
        {resolvedTheme === 'dark' ? t('dark') : t('light')}
      </span>
    </div>
  );
}
