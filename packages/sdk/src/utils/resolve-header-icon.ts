import type { ActocoreHeaderConfig, ActocoreLauncherConfig } from '../config/types';

export type ResolvedHeaderIcon =
  | { kind: 'hidden' }
  | { kind: 'url'; url: string }
  | { kind: 'default' };

export function resolveHeaderIcon(
  header: ActocoreHeaderConfig | undefined,
  launcher: ActocoreLauncherConfig | undefined,
): ResolvedHeaderIcon {
  if (header?.showIcon === false) {
    return { kind: 'hidden' };
  }

  const headerUrl = header?.iconUrl?.trim();
  if (headerUrl) {
    return { kind: 'url', url: headerUrl };
  }

  const hasHeaderConfig =
    header !== undefined &&
    (header.showIcon !== undefined || header.iconUrl !== undefined);

  if (!hasHeaderConfig) {
    const launcherUrl = launcher?.iconUrl?.trim();
    if (launcherUrl) {
      return { kind: 'url', url: launcherUrl };
    }
  }

  return { kind: 'default' };
}
