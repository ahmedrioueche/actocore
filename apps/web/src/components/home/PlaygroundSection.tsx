import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";

import { CtaButton } from "@/components/site/CtaButton";
import { useT } from "@/i18n/useT";
import { revealStyle } from "@/lib/reveal";
import { studioAuthPath } from "@/lib/site";

import { PlaygroundCta } from "./PlaygroundCta";
import { RevealOnScroll } from "./ScrollReveal";

const FEATURES = [
  { key: "chat" as const, icon: MessageSquare },
  { key: "knowledge" as const, icon: BookOpen },
  { key: "actions" as const, icon: Zap },
  { key: "layout" as const, icon: LayoutGrid },
] as const;

/** Stagger between feature cards when several enter the viewport together. */
const FEATURE_REVEAL_STEP_MS = 100;

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
    </div>
  );
}

export function PlaygroundSection() {
  const { t } = useT("home.playgroundSection");

  return (
    <section
      id="playground"
      className="relative overflow-hidden py-16 lg:py-24"
    >
      <div className="absolute inset-0 -z-10 bg-primary-muted/40" aria-hidden />
      <div className="site-container relative z-10">
        <div className="glass-panel overflow-hidden rounded-3xl border border-border shadow-brand">
          <div className="grid gap-10 p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:p-12">
            <RevealOnScroll
              className="flex flex-col justify-center"
              style={revealStyle(0)}
            >
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="h-4 w-4" aria-hidden />
                {t("eyebrow")}
              </p>
              <h2 className="mb-4 text-3xl font-bold text-text-primary lg:text-4xl">
                {t("title")}
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-text-secondary">
                {t("subtitle")}
              </p>
              <p className="mb-8 inline-flex w-fit items-center rounded-full border border-primary bg-primary-muted px-4 py-1.5 text-xs font-semibold text-primary">
                <span className="sm:hidden">{t("noSignupMobile")}</span>
                <span className="hidden sm:inline">{t("noSignup")}</span>
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PlaygroundCta className="px-8 py-3.5 text-base" />
                <CtaButton
                  href={studioAuthPath("signup")}
                  variant="outline"
                  className="px-8 py-3.5 text-base"
                >
                  {t("ctaSecondary")}
                </CtaButton>
              </div>
            </RevealOnScroll>

            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map(({ key, icon }, index) => (
                <RevealOnScroll
                  key={key}
                  scale
                  style={revealStyle(index + 1, FEATURE_REVEAL_STEP_MS)}
                >
                  <FeatureCard
                    title={t(`features.${key}.title`)}
                    description={t(`features.${key}.description`)}
                    icon={icon}
                  />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
