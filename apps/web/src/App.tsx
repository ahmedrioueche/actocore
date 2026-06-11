import { Navigate, Route, Routes } from 'react-router-dom';

import { SiteLayout } from '@/layouts/SiteLayout';
import { DocsPage } from '@/pages/DocsPage';
import { HomePage } from '@/pages/HomePage';
import { LocaleGate } from '@/pages/LocaleGate';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PricingPage } from '@/pages/PricingPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { TermsPage } from '@/pages/TermsPage';
import { routing } from '@/i18n/routing';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${routing.defaultLocale}`} replace />} />
      <Route path="/:locale" element={<LocaleGate />}>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={`/${routing.defaultLocale}`} replace />} />
    </Routes>
  );
}
