import { Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { PageHero } from '@/components/site/PageHero';
import { useT } from '@/i18n/useT';
import { usePageMeta } from '@/hooks/usePageMeta';

const CONTACT_CARDS = ['general', 'sales', 'engineering', 'privacy', 'security'] as const;

export function ContactPage() {
  const { t } = useT('contact');
  usePageMeta('contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = encodeURIComponent(
      `From: ${name} <${email}>\n\n${message}`,
    );
    const mailSubject = encodeURIComponent(subject || 'ActoCore inquiry');
    window.location.href = `mailto:contact@actocore.pro?subject=${mailSubject}&body=${body}`;
  };

  return (
    <div className="site-container py-16 sm:py-20">
      <PageHero title={t('title')} subtitle={t('subtitle')} />

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CONTACT_CARDS.map((key) => (
          <article
            key={key}
            className="glass-panel flex flex-col rounded-2xl border border-border p-6"
          >
            <div className="mb-4 inline-flex rounded-xl bg-primary-muted p-3 text-primary">
              <Mail className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="font-semibold text-text-primary">{t(`${key}.title`)}</h2>
            <p className="mt-2 flex-1 text-sm text-text-secondary">{t(`${key}.body`)}</p>
            <a
              href={`mailto:${t(`${key}.email`)}`}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              {t(`${key}.email`)}
            </a>
          </article>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-12 max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <h2 className="mb-6 text-lg font-semibold text-text-primary">{t('form.title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-text-secondary">{t('form.name')}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-text-secondary">{t('form.email')}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-text-secondary">{t('form.subject')}</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-text-secondary">{t('form.message')}</span>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-contrast shadow-md hover:brightness-110 sm:w-auto"
        >
          {t('form.submit')}
        </button>
      </form>
    </div>
  );
}
