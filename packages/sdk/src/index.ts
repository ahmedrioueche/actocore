import 'reflect-metadata';

export { ActocoreProvider } from './provider/actocore-provider';
export { ActoChat } from './components/ActoChat/ActoChat';
export type { ActoChatProps } from './components/ActoChat/ActoChat';
export { ActoChatWidget } from './components/ActoChat/ActoChatWidget';
export type { ActoChatWidgetProps } from './components/ActoChat/ActoChatWidget';

export type {
  ActocoreSdkConfig,
  ActocoreThemeConfig,
  ActocoreSecurityConfig,
  ActocoreUiConfig,
  ActocoreUiClassNames,
  ActocoreUiTextOverrides,
  ActocoreLauncherConfig,
  ActocoreI18nConfig,
} from './config/types';

export { useActocoreChat } from './hooks/use-actocore-chat';
export { useActocoreSession } from './hooks/use-actocore-session';
export { useActocoreRuntime } from './hooks/use-actocore-runtime';
export { useActocoreActions } from './hooks/use-actocore-actions';

export type { UiChatMessage } from './hooks/use-actocore-chat';

export { configureApi } from '@ahmedrioueche/actocore-shared';
export {
  chatApi,
  sessionsApi,
  runtimeApi,
  projectsApi,
  apiKeysApi,
  actionsApi,
  sdkActionsApi,
  knowledgeApi,
  sdkConfigApi,
  usageApi,
  healthApi,
} from '@ahmedrioueche/actocore-shared';
export type * from '@ahmedrioueche/actocore-shared/types';

