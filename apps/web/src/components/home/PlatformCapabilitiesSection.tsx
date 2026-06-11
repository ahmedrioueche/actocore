import { Activity, Check, GitBranch, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useT } from '@/i18n/useT';

import { RevealOnScroll } from './RevealOnScroll';

const CAPABILITY_CONFIG = [
  { key: 'observability' as const, icon: Activity, accent: 'primary' as const },
  { key: 'isolation' as const, icon: Shield, accent: 'secondary' as const },
  { key: 'rag' as const, icon: GitBranch, accent: 'accent' as const },
] as const;

const ACCENT_STYLES = {
  primary: {
    iconBg: 'bg-primary-muted',
    iconText: 'text-primary',
    bullet: 'text-primary',
  },
  secondary: {
    iconBg: 'bg-secondary/10',
    iconText: 'text-secondary',
    bullet: 'text-secondary',
  },
  accent: {
    iconBg: 'bg-accent/10',
    iconText: 'text-accent',
    bullet: 'text-accent',
  },
} as const;

type CapabilityCardProps = {
  title: string;
  description: string;
  bullets: string[];
  icon: LucideIcon;
  accent: keyof typeof ACCENT_STYLES;
};

function CapabilityCard({
  title,
  description,
  bullets,
  icon: Icon,
  accent,
}: CapabilityCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <RevealOnScroll>
      <article className="glass-panel card-hover h-full rounded-3xl p-8">
        <div
          className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl ${styles.iconBg}`}
        >
          <Icon className={`h-8 w-8 ${styles.iconText}`} aria-hidden />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-text-primary">{title}</h3>
        <p className="mb-4 text-text-secondary">{description}</p>
        <ul className="space-y-2 text-sm text-muted">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-2">
              <Check className={`h-4 w-4 ${styles.bullet}`} aria-hidden />
              {bullet}
            </li>
          ))}
        </ul>
      </article>
    </RevealOnScroll>
  );
}

export function PlatformCapabilitiesSection() {
  const { t } = useT('home.capabilities');

  return (
    <section className="relative overflow-hidden py-16 lg:py-24" id="features">
      <div className="site-container relative z-10">
        <div className="mb-16 max-w-3xl">
          <h2 className="mb-4 text-3xl font-bold text-text-primary lg:text-4xl">
            {t('title')}
          </h2>
          <p className="text-lg text-text-secondary">{t('subtitle')}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {CAPABILITY_CONFIG.map(({ key, icon, accent }) => (
            <CapabilityCard
              key={key}
              title={t(`${key}.title`)}
              description={t(`${key}.description`)}
              bullets={t(`${key}.bullets`, { returnObjects: true }) as string[]}
              icon={icon}
              accent={accent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
