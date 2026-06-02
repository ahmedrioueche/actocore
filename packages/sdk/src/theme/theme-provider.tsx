import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { useActocoreConfig } from '../context/actocore-context';

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

export function ActocoreThemeRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { theme } = useActocoreConfig();
  const style = useMemo(() => tokensToStyle(theme.tokens), [theme.tokens]);
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
