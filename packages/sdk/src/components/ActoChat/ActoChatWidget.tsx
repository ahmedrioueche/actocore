import type { ReactNode } from 'react';
import {
  ActoChatWidgetProvider,
  type ActoChatWidgetProviderProps,
} from './ActoChatWidgetContext';
import {
  ActoChatWidgetPanel,
  type ActoChatWidgetPanelProps,
} from './ActoChatWidgetPanel';

export type ActoChatWidgetProps = ActoChatWidgetPanelProps &
  Pick<ActoChatWidgetProviderProps, 'initialOpen' | 'hideWhenSelector'> & {
    className?: string;
    launcherIcon?: ReactNode;
  };

export function ActoChatWidget({
  initialOpen,
  hideWhenSelector,
  className,
  ...panelProps
}: ActoChatWidgetProps) {
  return (
    <ActoChatWidgetProvider
      initialOpen={initialOpen}
      hideWhenSelector={hideWhenSelector}
    >
      <ActoChatWidgetPanel className={className} {...panelProps} />
    </ActoChatWidgetProvider>
  );
}

export { ActoChatWidgetPanel } from './ActoChatWidgetPanel';
export { ActoChatLauncher } from './ActoChatLauncher';
export {
  ActoChatWidgetProvider,
  useActoChatWidget,
  useOptionalActoChatWidget,
} from './ActoChatWidgetContext';
export type {
  ActoChatWidgetContextValue,
  ActoChatWidgetProviderProps,
} from './ActoChatWidgetContext';
export type { ActoChatWidgetPanelProps, WidgetPosition } from './ActoChatWidgetPanel';
export type { ActoChatLauncherProps } from './ActoChatLauncher';
