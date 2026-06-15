import "reflect-metadata";

export { ActoChat } from "./components/ActoChat/ActoChat";
export type { ActoChatProps } from "./components/ActoChat/ActoChat";
export { ActoChatWidget } from "./components/ActoChat/ActoChatWidget";
export type { ActoChatWidgetProps } from "./components/ActoChat/ActoChatWidget";
export { ActocoreProvider } from "./provider/actocore-provider";

export type {
  ActocoreI18nConfig,
  ActocoreLauncherConfig,
  ActocoreSdkConfig,
  ActocoreSecurityConfig,
  ActocoreThemeConfig,
  ActocoreUiClassNames,
  ActocoreUiConfig,
  ActocoreUiTextOverrides,
  ActocoreSeedMessage,
} from "./config/types";

export { useActocoreHostContext } from "./context/actocore-context";
export { useActocoreActions } from "./hooks/use-actocore-actions";
export { useActocoreChat } from "./hooks/use-actocore-chat";
export { useActocoreRuntime } from "./hooks/use-actocore-runtime";
export { useActocoreSession } from "./hooks/use-actocore-session";

export type { UiChatMessage } from "./hooks/use-actocore-chat";

export {
  actionsApi,
  apiKeysApi,
  chatApi,
  configureApi,
  healthApi,
  knowledgeApi,
  projectsApi,
  runtimeApi,
  sdkActionsApi,
  sdkConfigApi,
  sessionsApi,
} from "@ahmedrioueche/actocore-shared";
export type * from "@ahmedrioueche/actocore-shared/types";
