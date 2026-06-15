import { BookOpen, Code2, FolderKanban, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useT } from '@/i18n/useT';

import { PlaygroundCta } from './PlaygroundCta';
import { ScrollReveal } from './ScrollReveal';

const STEPS = [
  { key: 'project' as const, icon: FolderKanban, accent: 'primary' as const },
  { key: 'knowledge' as const, icon: BookOpen, accent: 'secondary' as const },
  { key: 'actions' as const, icon: Zap, accent: 'accent' as const },
  { key: 'embed' as const, icon: Code2, accent: 'primary' as const },
] as const;

const ACCENT_ICON = {
  primary: 'bg-primary-muted text-primary',
  secondary: 'bg-surface-secondary text-secondary',
  accent: 'bg-surface-secondary text-accent',
} as const;

type StepCardProps = {
  step: number;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  accent: keyof typeof ACCENT_ICON;
};

function StepCard({ step, title, description, detail, icon: Icon, accent }: StepCardProps) {
  return (
    <article className="relative flex flex-col max-md:pl-12">
      <div className="absolute left-0 top-0 lg:relative lg:mb-6 lg:flex lg:justify-center">
        <div className="relative">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-border lg:h-14 lg:w-14 ${ACCENT_ICON[accent]}`}
          >
            <Icon className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden />
          </div>
          <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-elevated text-[10px] font-bold text-primary shadow-sm lg:h-7 lg:w-7 lg:text-xs">
            {step}
          </span>
        </div>
      </div>

      <div className="glass-panel card-hover flex flex-1 flex-col rounded-2xl border border-border p-6">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mb-3 text-sm leading-relaxed text-text-secondary">{description}</p>
        <p className="mt-auto text-xs font-medium uppercase tracking-wide text-muted">{detail}</p>
      </div>
    </article>
  );
}

export function HowItWorksSection() {
  const { t } = useT('home.howItWorks');

  return (
    <ScrollReveal
      as="section"
      id="how-it-works"
      className="relative overflow-hidden py-16 lg:py-24"
    >
      <div className="site-container relative z-10">
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            {t('eyebrow')}
          </p>
          <h2 className="mb-4 text-3xl font-bold text-text-primary lg:text-4xl">{t('title')}</h2>
          <p className="text-lg text-text-secondary">{t('subtitle')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map(({ key, icon, accent }, index) => (
            <StepCard
              key={key}
              step={index + 1}
              title={t(`steps.${key}.title`)}
              description={t(`steps.${key}.description`)}
              detail={t(`steps.${key}.detail`)}
              icon={icon}
              accent={accent}
            />
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center lg:mt-16">
          <p className="max-w-xl text-text-secondary">{t('ctaHint')}</p>
          <PlaygroundCta variant="outline" className="px-8 py-3.5 text-base" />
        </div>
      </div>
    </ScrollReveal>
  );
}
