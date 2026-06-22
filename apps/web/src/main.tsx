import 'reflect-metadata';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';

import { App } from '@/App';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import Toaster from '@/components/ui/Toaster';
import i18n from '@/i18n';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
          <Toaster />
        </ThemeProvider>
      </BrowserRouter>
    </I18nextProvider>
  </StrictMode>,
);
