import { useT } from "@/i18n/useT";
import { Brain } from "lucide-react";

export function HeroDemoTerminal() {
  const { t } = useT("home.hero.demo");

  return (
    <div className="glass-panel flex h-full flex-col overflow-hidden rounded-2xl p-1 shadow-2xl">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-secondary">
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface-secondary px-4 py-2.5 sm:px-5 sm:py-3">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-danger/30" />
            <div className="h-3 w-3 rounded-full bg-secondary/30" />
            <div className="h-3 w-3 rounded-full bg-primary/30" />
          </div>
          <div className="truncate font-mono text-xs text-muted sm:text-sm">
            {t("filename")}
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 font-mono text-xs sm:space-y-4 sm:p-6 sm:text-sm">
          <div className="text-primary">{t("line1")}</div>
          <div className="text-secondary">{t("line2")}</div>
          <div className="italic text-text-secondary">{t("userQuery")}</div>
          <div className="flex gap-3 rounded-lg border border-border bg-surface-secondary p-3 sm:gap-5 sm:p-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent">
              <Brain
                className="h-3.5 w-3.5 text-primary-contrast"
                aria-hidden
              />
            </div>
            <div className="text-text-primary">
              {t("response")}
              <br />
              <span className="text-accent">{t("suggestion")}</span>
            </div>
          </div>
          <div className="text-muted">{t("awaiting")}</div>
        </div>
      </div>
    </div>
  );
}
