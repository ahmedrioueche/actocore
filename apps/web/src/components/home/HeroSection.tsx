import { useT } from "@/i18n/useT";
import { ArrowRight, CheckCircle } from "lucide-react";

import { CtaButton } from "@/components/site/CtaButton";
import { LocaleLink } from "@/i18n/LocaleLink";
import { playgroundPath, studioAuthPath } from "@/lib/site";

import { AnimatedBlobs } from "./AnimatedBlobs";
import { HeroChat } from "./HeroChat";

const TRUST_KEYS = ["gdpr", "zeroRetention", "uptime"] as const;

export function HeroSection() {
  const { t } = useT("home.hero");
  const { t: tHome } = useT("home");

  return (
    <section className="relative overflow-hidden py-16 lg:py-32">
      <AnimatedBlobs className="hero-entrance-blobs" />
      <div className="site-container relative z-10">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-stretch lg:gap-16">
          <div className="order-1 w-full flex-1 space-y-8 text-center lg:order-1 lg:text-left">
            <div className="hero-entrance-badge mb-4 inline-flex items-center gap-2 rounded-full border border-primary bg-primary-muted px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {t("badge")}
            </div>
            <h1 className="hero-entrance-title text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-brand-gradient">{t("title")}</span>
            </h1>
            <p className="hero-entrance-subtitle mx-auto max-w-2xl text-lg text-text-secondary lg:mx-0">
              {t("subtitle")}
            </p>
            <div className="hero-entrance-cta flex flex-wrap justify-center gap-4 pt-4 lg:justify-start">
              <CtaButton
                href={studioAuthPath("signup")}
                className="gap-2 px-8 py-4 text-base"
              >
                {t("ctaPrimary")}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </CtaButton>
              <LocaleLink
                href={playgroundPath()}
                className="glass-panel inline-flex items-center justify-center gap-2 rounded-xl border border-border px-8 py-4 text-base font-semibold text-text-primary transition-colors hover:bg-surface-hover"
              >
                {tHome("goToPlayground")}
              </LocaleLink>
            </div>
            <div className="hero-entrance-trust flex flex-wrap justify-center gap-8 pt-8 opacity-60 lg:justify-start">
              {TRUST_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" aria-hidden />
                  <span>{t(`trust.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-2 flex w-full justify-center lg:w-auto lg:flex-none lg:justify-end">
            <HeroChat />
          </div>
        </div>
      </div>
    </section>
  );
}
