import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { AuthBrandVariant } from '@/components/auth/auth-panel.types';

interface AuthBrandCodeSnippetProps {
  variant?: AuthBrandVariant;
}

function CodeWindow({ children }: { children: ReactNode }) {
  return (
    <div className="auth-code-glow ml-auto max-w-md overflow-hidden rounded-xl border border-white/10 bg-[var(--ac-auth-code-surface)] p-6 backdrop-blur-xl lg:ml-0">
      <div className="mb-4 flex gap-1.5" aria-hidden>
        <div className="h-3 w-3 rounded-full bg-danger/40" />
        <div className="h-3 w-3 rounded-full bg-accent/40" />
        <div className="h-3 w-3 rounded-full bg-secondary/50" />
      </div>
      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-primary-contrast/80">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function LoginSnippet() {
  const { t } = useTranslation();
  const p = 'auth.brand.code';

  return (
    <CodeWindow>
      <span className="text-[var(--ac-auth-code-keyword)]">{t(`${p}.const`)}</span>{' '}
      {t(`${p}.variable`)}{' '}
      <span className="text-[var(--ac-auth-code-keyword)]">= new</span> ActoCore();
      {'\n'}
      <span className="text-[var(--ac-auth-code-keyword)]">await</span>{' '}
      {t(`${p}.variable`)}.integrate({'{'}
      {'\n'}  {t(`${p}.engineKey`)}:{' '}
      <span className="text-[var(--ac-auth-code-string)]">
        &apos;{t(`${p}.engineValue`)}&apos;
      </span>
      ,{'\n'}  {t(`${p}.contextKey`)}:{' '}
      <span className="text-[var(--ac-auth-code-string)]">
        &apos;{t(`${p}.contextValue`)}&apos;
      </span>
      {'\n'}
      {'}'});
      {'\n'}
      <span className="text-primary-contrast/50">{t(`${p}.comment`)}</span>
    </CodeWindow>
  );
}

function SignupSnippet() {
  const { t } = useTranslation();
  const p = 'auth.brand.signup.code';

  return (
    <CodeWindow>
      <span className="text-[var(--ac-auth-code-keyword)]">{t(`${p}.const`)}</span>{' '}
      {t(`${p}.variable`)}{' '}
      <span className="text-[var(--ac-auth-code-keyword)]">= new</span> ActoCore({'{'}
      {'\n'}  {t(`${p}.modeKey`)}:{' '}
      <span className="text-[var(--ac-auth-code-string)]">
        &apos;{t(`${p}.modeValue`)}&apos;
      </span>
      ,{'\n'}  {t(`${p}.intelligenceKey`)}:{' '}
      <span className="text-[var(--ac-auth-code-accent)]">
        {t(`${p}.intelligenceValue`)}
      </span>
      ,{'\n'}  {t(`${p}.featuresKey`)}: [
      <span className="text-[var(--ac-auth-code-string)]">
        &apos;{t(`${p}.featureQa`)}&apos;
      </span>
      ,{' '}
      <span className="text-[var(--ac-auth-code-string)]">
        &apos;{t(`${p}.featureAutomation`)}&apos;
      </span>
      ]{'\n'}
      {'}'});
      {'\n'}
      <span className="text-primary-contrast/50">{t(`${p}.comment`)}</span>
    </CodeWindow>
  );
}

export function AuthBrandCodeSnippet({
  variant = 'login',
}: AuthBrandCodeSnippetProps) {
  return variant === 'signup' ? <SignupSnippet /> : <LoginSnippet />;
}
