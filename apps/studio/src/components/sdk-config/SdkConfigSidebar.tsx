import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  SDK_CONFIG_NAV,
  sdkConfigSectionHash,
  type SdkConfigSectionId,
} from '@/constants/sdk-config-nav';
import { cn } from '@/utils/helper';

const ITEM_BASE =
  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors md:w-full';

function readSectionFromHash(): SdkConfigSectionId {
  const hash = window.location.hash.replace(/^#/, '');
  const match = SDK_CONFIG_NAV.find((item) => item.id === hash);
  return match?.id ?? SDK_CONFIG_NAV[0].id;
}

export function SdkConfigSidebar() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SdkConfigSectionId>(() =>
    typeof window !== 'undefined' ? readSectionFromHash() : 'appearance',
  );

  useEffect(() => {
    const sync = () => setActiveSection(readSectionFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const scrollToSection = (id: SdkConfigSectionId) => {
    setActiveSection(id);
    window.location.hash = id;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="w-full shrink-0 md:sticky md:top-24 md:w-56 md:self-start">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {t('sdkConfig.sidebarTitle')}
      </p>
      <nav className="flex gap-1 overflow-x-auto pb-1 hide-scrollbar md:block md:space-y-1 md:overflow-visible md:pb-0">
        {SDK_CONFIG_NAV.map((item) => {
          const active = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className={cn(
                ITEM_BASE,
                active
                  ? 'bg-surface-hover text-text-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>
      <p className="mt-4 hidden px-1 text-xs text-text-secondary md:block">
        {t('sdkConfig.sidebarHint')}
      </p>
      <a
        href={sdkConfigSectionHash('widget')}
        className="sr-only"
        onClick={(event) => event.preventDefault()}
      >
        {t('sdkConfig.nav.widget')}
      </a>
    </aside>
  );
}
