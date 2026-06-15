import { useEffect } from 'react';
import { useT } from '@/i18n/useT';
import { useParams } from 'react-router-dom';

import { isAppLocale } from '@/i18n/routing';

type PageMetaKey =
  | 'home'
  | 'pricing'
  | 'docs'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'security'
  | 'compliance';

export function usePageMeta(page: PageMetaKey) {
  const { t } = useT('meta');
  const { locale } = useParams();
  const activeLocale = isAppLocale(locale) ? locale : 'en';

  useEffect(() => {
    const title = t(`${page}.title`);
    const description = t(`${page}.description`);

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
    document.documentElement.lang = activeLocale;
  }, [t, page, activeLocale]);
}
