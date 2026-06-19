import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useActocoreConfig } from '../context/actocore-context';
import {
  resolveEffectiveThemeMode,
  resolveThemeTokensForMode,
} from './resolve-theme-tokens';
import { resolveLayoutTokens } from './resolve-layout-tokens';

function tokensToStyle(tokens: Record<string, string> | undefined): CSSProperties {
  if (!tokens) {
    return {};
  }
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const cssVar = key.startsWith('--ac-') ? key : `--ac-${key}`;
    style[cssVar] = value;
  }
  return style as CSSProperties;
}

function usePrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setPrefersDark(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return prefersDark;
}

export function ActocoreThemeRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { theme, ui } = useActocoreConfig();
  const prefersDark = usePrefersDark();
  const effectiveMode = resolveEffectiveThemeMode(theme.mode, prefersDark);
  const activeTokens = useMemo(
    () => ({
      ...resolveThemeTokensForMode(theme.tokens, effectiveMode),
      ...resolveLayoutTokens(ui),
    }),
    [theme.tokens, effectiveMode, ui],
  );
  const style = useMemo(() => tokensToStyle(activeTokens), [activeTokens]);
  const mode =
    theme.mode === 'system'
      ? undefined
      : theme.mode;

  const rootClass = [className, theme.className].filter(Boolean).join(' ');

  return (
    <div
      data-actocore
      data-actocore-theme={mode}
      className={rootClass || undefined}
      style={style}
    >
      {children}
    </div>
  );
}

/** Sync `prefers-color-scheme` when theme.mode is `system`. */
export function ActocoreSystemThemeSync() {
  const { theme } = useActocoreConfig();

  useEffect(() => {
    if (theme.mode !== 'system' || typeof window === 'undefined') {
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.querySelectorAll('[data-actocore]').forEach((el) => {
        el.setAttribute(
          'data-actocore-theme',
          mq.matches ? 'dark' : 'light',
        );
      });
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme.mode]);

  return null;
}
