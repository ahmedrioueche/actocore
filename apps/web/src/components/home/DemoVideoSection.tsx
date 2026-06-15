import { Play } from 'lucide-react';
import { useMemo } from 'react';

import { useT } from '@/i18n/useT';
import { getDemoVideoUrl, resolveDemoVideoEmbed } from '@/lib/demo-video';

import { ScrollReveal } from './ScrollReveal';

export function DemoVideoSection() {
  const { t } = useT('home.demoVideo');
  const embed = useMemo(() => {
    const url = getDemoVideoUrl();
    return url ? resolveDemoVideoEmbed(url) : null;
  }, []);

  return (
    <ScrollReveal as="section" id="demo" className="py-12 lg:py-16">
      <div className="site-container">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            {t('eyebrow')}
          </p>
          <h2 className="mb-3 text-3xl font-bold text-text-primary lg:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-text-secondary">
            {t('subtitle')}
          </p>

          <div className="glass-panel overflow-hidden rounded-2xl border border-border shadow-2xl">
            <div className="relative aspect-video bg-surface-secondary">
              {embed?.kind === 'direct' ? (
                <video
                  className="absolute inset-0 h-full w-full bg-black object-contain"
                  controls
                  playsInline
                  preload="metadata"
                  src={embed.src}
                  title={t('title')}
                />
              ) : embed ? (
                <iframe
                  className="absolute inset-0 h-full w-full border-0"
                  src={embed.embedUrl}
                  title={t('title')}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-elevated shadow-lg">
                    <Play
                      className="ml-1 h-7 w-7 text-primary"
                      aria-hidden
                      fill="currentColor"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-primary">
                      {t('placeholderTitle')}
                    </p>
                    <p className="text-xs text-muted">{t('placeholderHint')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
