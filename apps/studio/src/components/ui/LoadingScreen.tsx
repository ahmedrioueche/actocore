import React from "react";
import { useTranslation } from "react-i18next";

import { APP_DATA } from "@/constants/app";
import AnimatedLogo from "./AnimatedLogo";

export interface LoadingScreenProps {
  /** `outer` = boot screen (logo intro); `inner` = in-app shell loading */
  type?: "inner" | "outer";
  message?: string;
}

/**
 * Full-viewport loading UI block. Prefer `@/pages/system/LoadingPage` for routes.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  type = "outer",
  message,
}) => {
  const { t } = useTranslation();
  const isBoot = type === "outer";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-text-primary">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-soft-pulse rounded-full bg-primary/10 blur-[100px]" />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-soft-pulse rounded-full bg-secondary/15 blur-[100px]"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <AnimatedLogo animateOnce={isBoot} keepWordmarkVisible={isBoot} />

        <div className="mt-10 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-text-secondary">
            {message || t("general.loading")}
          </p>

          <p className="text-base font-medium text-text-muted">
            {t("general.please_wait")}
          </p>

          <div
            className="mx-auto mt-8 h-1 w-44 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-label={message || t("general.loading")}
          >
            <div className="loading-screen-bar h-full w-full rounded-full bg-gradient-to-r from-primary to-secondary" />
          </div>
        </div>

        <p className="mt-12 text-xs font-medium tracking-wide text-text-muted">
          {APP_DATA.name}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
