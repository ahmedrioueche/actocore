import type { ReactNode } from 'react';
import { useActocoreUiConfig } from '../../context/actocore-context';
import { DefaultLauncherIcon } from './DefaultLauncherIcon';

export function LauncherIcon({
  customIcon,
}: {
  customIcon?: ReactNode;
}) {
  const ui = useActocoreUiConfig();

  if (customIcon) {
    return <>{customIcon}</>;
  }

  const iconUrl = ui.launcher?.iconUrl;
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        style={{
          width: 'var(--ac-launcher-icon-size)',
          height: 'var(--ac-launcher-icon-size)',
          objectFit: 'contain',
        }}
      />
    );
  }

  return <DefaultLauncherIcon />;
}
