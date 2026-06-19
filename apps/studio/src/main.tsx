import { initClarity } from '@/lib/clarity';
import { setupChunkLoadRecovery } from '@/lib/chunk-load-recovery';
import { initSentry } from '@/lib/sentry';

initSentry();
initClarity();
setupChunkLoadRecovery();

import 'reflect-metadata';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/i18n';
import { ensureApiConfigured } from '@/lib/configure-api';
import { AppProviders } from '@/providers/AppProviders';

ensureApiConfigured();
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
