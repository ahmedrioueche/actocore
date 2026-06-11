import { Brain } from 'lucide-react';
import { useT } from '@/i18n/useT';

export function HeroDemoTerminal() {
  const { t } = useT('home.hero.demo');

  return (
    <div className="glass-panel overflow-hidden rounded-2xl p-1 shadow-2xl">
      <div className="overflow-hidden rounded-xl border border-border/50 bg-surface-secondary">
        <div className="flex items-center justify-between bg-surface/50 px-5 py-3">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-danger/30" />
            <div className="h-3 w-3 rounded-full bg-secondary/30" />
            <div className="h-3 w-3 rounded-full bg-primary/30" />
          </div>
          <div className="font-mono text-sm text-muted">{t('filename')}</div>
        </div>
        <div className="space-y-4 p-8 font-mono text-sm">
          <div className="text-primary">{t('line1')}</div>
          <div className="text-secondary">{t('line2')}</div>
          <div className="italic text-text-secondary">{t('userQuery')}</div>
          <div className="flex gap-5 rounded-lg border border-border/50 bg-surface/50 p-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent">
              <Brain className="h-3.5 w-3.5 text-primary-contrast" aria-hidden />
            </div>
            <div className="text-text-primary">
              {t('response')}
              <br />
              <span className="text-accent">{t('suggestion')}</span>
            </div>
          </div>
          <div className="text-muted">{t('awaiting')}</div>
        </div>
      </div>
    </div>
  );
}
