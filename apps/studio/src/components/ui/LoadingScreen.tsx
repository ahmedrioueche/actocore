import React from "react";
import { useTranslation } from "react-i18next";

import { APP_DATA } from "@/constants/app";
import AnimatedLogo from "./AnimatedLogo";

export interface LoadingScreenProps {
  /** `outer` = branded boot screen; `inner` = app shell background */
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

  const isOuter = type === "outer";

  return (
    <div
      className={
        isOuter
          ? "auth-brand-panel relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-primary-contrast"
          : "relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-text-primary"
      }
    >
      {isOuter ? (
        <>
          <div
            className="pointer-events-none absolute top-0 right-0 h-[28rem] w-[28rem] -translate-y-1/3 translate-x-1/4 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/4 translate-y-1/3 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-soft-pulse rounded-full bg-primary/10 blur-[100px]" />
          <div
            className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-soft-pulse rounded-full bg-secondary/15 blur-[100px]"
            style={{ animationDelay: "2s" }}
          />
        </div>
      )}

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <AnimatedLogo
          variant={isOuter ? "onDark" : "default"}
          animateOnce={isOuter}
          keepWordmarkVisible={isOuter}
        />

        <div className="mt-10 space-y-3">
          <p
            className={`text-sm font-semibold uppercase tracking-[0.24em] ${
              isOuter ? "text-primary-contrast/80" : "text-text-secondary"
            }`}
          >
            {message || t("general.loading")}
          </p>

          <p
            className={`text-base font-medium ${
              isOuter ? "text-primary-contrast/70" : "text-text-muted"
            }`}
          >
            {t("general.please_wait")}
          </p>

          <div
            className={`mx-auto mt-8 h-1 w-44 overflow-hidden rounded-full ${
              isOuter ? "bg-white/15" : "bg-border"
            }`}
            role="progressbar"
            aria-label={message || t("general.loading")}
          >
            <div className="loading-screen-bar h-full w-full rounded-full bg-gradient-to-r from-primary to-secondary" />
          </div>
        </div>

        <p
          className={`mt-12 text-xs font-medium tracking-wide ${
            isOuter ? "text-primary-contrast/50" : "text-text-muted"
          }`}
        >
          {APP_DATA.name}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
