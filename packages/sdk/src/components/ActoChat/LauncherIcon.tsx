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
}: {
  customIcon?: ReactNode;
  size?: LauncherIconSize;
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

  const iconUrl = ui.launcher?.iconUrl;
  if (iconUrl) {
    return <img src={iconUrl} alt="" style={iconStyle} />;
  }

  return <DefaultLauncherIcon />;
}
