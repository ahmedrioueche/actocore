import type { CSSProperties, ReactNode } from 'react';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { DefaultLauncherIcon } from './DefaultLauncherIcon';

export type LauncherIconSize = 'launcher' | 'header';

const SIZE_VARS: Record<LauncherIconSize, string> = {
  launcher: 'var(--ac-launcher-icon-size)',
  header: 'var(--ac-header-icon-size)',
};

export function LauncherIcon({
  customIcon,
  size = 'launcher',
  iconUrl,
  useDefaultWhenUnset = false,
}: {
  customIcon?: ReactNode;
  size?: LauncherIconSize;
  /** Explicit image URL (header config or resolved override). */
  iconUrl?: string;
  /** When true, show the built-in icon instead of falling back to launcher URL. */
  useDefaultWhenUnset?: boolean;
}) {
  const ui = useActocoreUiConfig();
  const iconStyle: CSSProperties = {
    width: SIZE_VARS[size],
    height: SIZE_VARS[size],
    objectFit: 'contain',
  };

  if (customIcon) {
    return <>{customIcon}</>;
  }

  const resolvedUrl = iconUrl?.trim() || (!useDefaultWhenUnset ? ui.launcher?.iconUrl?.trim() : undefined);
  if (resolvedUrl) {
    return <img src={resolvedUrl} alt="" style={iconStyle} />;
  }

  return <DefaultLauncherIcon />;
}
