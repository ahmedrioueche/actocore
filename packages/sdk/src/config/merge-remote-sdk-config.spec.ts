import { describe, expect, it } from 'vitest';
import { mergeRemoteSdkConfig } from './merge-remote-sdk-config';
import type { ActocoreSdkConfig } from './types';

describe('mergeRemoteSdkConfig', () => {
  const local: ActocoreSdkConfig = {
    apiKey: 'local-key',
    baseURL: 'http://localhost:3000',
    i18n: { locale: 'en', translations: { en: { chat: { send: 'Send' } } } },
    theme: { mode: 'dark', tokens: { 'color-primary': '#111' } },
    security: { allowedActionNames: ['deploy'], enforceActionAllowlist: true },
    ui: { showSources: false, text: { headerTitle: 'Host' } },
    voice: { input: false, language: 'en-US' },
  };

  const remote = {
    sdkConfigVersion: 2,
    i18n: { locale: 'fr', translations: { fr: { chat: { send: 'Envoyer' } } } },
    theme: { mode: 'light', tokens: { 'color-primary': '#fff', 'color-bg': '#eee' } },
    security: { allowedActionNames: ['list_users'], enforceActionAllowlist: false },
    ui: { showSources: true, showIntentBadge: true, text: { placeholder: 'Dashboard' } },
    voice: { input: true, output: true, inputMode: 'server' as const },
  };

  it('returns local unchanged when remote is missing', () => {
    expect(mergeRemoteSdkConfig(local, null)).toBe(local);
    expect(mergeRemoteSdkConfig(local, undefined)).toBe(local);
  });

  it('prefers local props over dashboard defaults', () => {
    const merged = mergeRemoteSdkConfig(local, remote);

    expect(merged.i18n?.locale).toBe('en');
    expect(merged.i18n?.translations?.en?.chat?.send).toBe('Send');
    expect(merged.i18n?.translations?.fr?.chat?.send).toBe('Envoyer');

    expect(merged.theme?.mode).toBe('dark');
    expect(merged.theme?.tokens).toEqual({
      'color-primary': '#111',
      'color-bg': '#eee',
    });

    expect(merged.security?.allowedActionNames).toEqual(['deploy']);
    expect(merged.security?.enforceActionAllowlist).toBe(true);

    expect(merged.ui?.showSources).toBe(false);
    expect(merged.ui?.showIntentBadge).toBe(true);
    expect(merged.ui?.text).toEqual({
      placeholder: 'Dashboard',
      headerTitle: 'Host',
    });

    expect(merged.voice?.input).toBe(false);
    expect(merged.voice?.output).toBe(true);
    expect(merged.voice?.inputMode).toBe('server');
    expect(merged.voice?.language).toBe('en-US');
  });

  it('fills gaps from remote when local omits sections', () => {
    const merged = mergeRemoteSdkConfig(
      { apiKey: 'k', baseURL: 'http://core' },
      remote,
    );

    expect(merged.i18n?.locale).toBe('fr');
    expect(merged.ui?.showSources).toBe(true);
    expect(merged.security?.allowedActionNames).toEqual(['list_users']);
    expect(merged.voice?.inputMode).toBe('server');
  });
});
