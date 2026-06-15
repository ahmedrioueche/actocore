import { useT } from "@/i18n/useT";
import { Code, Cpu, Sparkles } from "lucide-react";

import { ScrollReveal } from "./ScrollReveal";

const LAYERS = [
  { key: "engine" as const, icon: Cpu, variant: "default" as const },
  { key: "sdk" as const, icon: Code, variant: "featured" as const },
  { key: "studio" as const, icon: Sparkles, variant: "default" as const },
] as const;

export function ArchitectureSection() {
  const { t } = useT("home.architecture");

  return (
    <ScrollReveal as="section" id="architecture" className="bg-surface-secondary py-16 lg:py-24">
      <div className="site-container">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-text-primary lg:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-text-secondary">{t("subtitle")}</p>
        </div>

        <div className="relative">
          <div
            className="absolute left-1/3 right-1/3 top-1/2 hidden h-0.5 -translate-y-1/2 border-t-2 border-dashed border-border lg:block"
            aria-hidden
          />
          <div className="grid gap-12 lg:grid-cols-3">
          {LAYERS.map(({ key, icon: Icon, variant }) => {
            const isFeatured = variant === "featured";

            return (
              <div
                key={key}
                className={`relative flex flex-col items-center rounded-3xl p-12 text-center ${
                  isFeatured
                    ? "border-2 border-primary bg-surface-elevated shadow-brand lg:-translate-y-8"
                    : "border border-border bg-background"
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-4 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary-contrast">
                    {t("recommended")}
                  </span>
                )}
                <div
                  className={`mb-8 flex h-20 w-20 items-center justify-center rounded-full ${
                    isFeatured
                      ? "bg-primary text-primary-contrast shadow-brand"
                      : key === "studio"
                        ? "border border-border bg-surface-secondary"
                        : "border border-border bg-primary-muted"
                  }`}
                >
                  <Icon
                    className={`h-10 w-10 ${isFeatured ? "" : key === "studio" ? "text-accent" : "text-primary"}`}
                    aria-hidden
                  />
                </div>
                <h3 className="mb-4 text-xl font-bold text-text-primary">
                  {t(`${key}.title`)}
                </h3>
                <p className="mb-8 text-sm text-text-secondary">
                  {t(`${key}.description`)}
                </p>
                <span
                  className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest ${
                    isFeatured
                      ? "bg-primary-muted text-primary"
                      : "bg-surface-secondary text-muted"
                  }`}
                >
                  {t(`${key}.badge`)}
                </span>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
