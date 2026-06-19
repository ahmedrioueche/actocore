import type { LucideIcon } from "lucide-react";
import {
  LayoutTemplate,
  LoaderCircle,
  MessageSquare,
  PanelRight,
  Rows3,
  Type,
} from "lucide-react";

export type SdkConfigSectionId =
  | "appearance"
  | "chat-behavior"
  | "loading"
  | "widget"
  | "inline"
  | "copy";

export interface SdkConfigNavItem {
  id: SdkConfigSectionId;
  labelKey: string;
  icon: LucideIcon;
}

export const SDK_CONFIG_NAV: SdkConfigNavItem[] = [
  {
    id: "appearance",
    labelKey: "sdkConfig.nav.appearance",
    icon: LayoutTemplate,
  },
  { id: "widget", labelKey: "sdkConfig.nav.widget", icon: PanelRight },
  { id: "inline", labelKey: "sdkConfig.nav.inline", icon: Rows3 },
  {
    id: "chat-behavior",
    labelKey: "sdkConfig.nav.chatBehavior",
    icon: MessageSquare,
  },
  {
    id: "loading",
    labelKey: "sdkConfig.nav.loading",
    icon: LoaderCircle,
  },
  { id: "copy", labelKey: "sdkConfig.nav.copy", icon: Type },
];

export function sdkConfigSectionHash(id: SdkConfigSectionId): string {
  return `#${id}`;
}

export function readSdkConfigSectionFromHash(): SdkConfigSectionId {
  if (typeof window === "undefined") {
    return SDK_CONFIG_NAV[0].id;
  }

  const hash = window.location.hash.replace(/^#/, "");
  const match = SDK_CONFIG_NAV.find((item) => item.id === hash);
  return match?.id ?? SDK_CONFIG_NAV[0].id;
}
