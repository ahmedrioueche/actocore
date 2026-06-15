import { describe, expect, it } from 'vitest';
import {
  resolveEffectiveThemeMode,
  resolveThemeTokensForMode,
} from './resolve-theme-tokens';

describe('resolveThemeTokensForMode', () => {
  it('returns undefined when tokens are missing', () => {
    expect(resolveThemeTokensForMode(undefined, 'light')).toBeUndefined();
  });

  it('resolves prefixed light and dark palettes independently', () => {
    const tokens = {
      'light-color-chat-body-bg': '#fafbfd',
      'dark-color-chat-body-bg': '#0b1220',
      'light-color-primary': '#4f46e5',
      'dark-color-primary': '#6366f1',
      'font-family': 'Inter, sans-serif',
    };

    expect(resolveThemeTokensForMode(tokens, 'light')).toEqual({
      'color-chat-body-bg': '#fafbfd',
      'color-primary': '#4f46e5',
      'font-family': 'Inter, sans-serif',
    });

    expect(resolveThemeTokensForMode(tokens, 'dark')).toEqual({
      'color-chat-body-bg': '#0b1220',
      'color-primary': '#6366f1',
      'font-family': 'Inter, sans-serif',
    });
  });

  it('falls back to legacy unprefixed tokens when no prefixed keys exist', () => {
    const tokens = {
      'color-chat-body-bg': '#fafafa',
      'color-primary': '#111111',
    };

    expect(resolveThemeTokensForMode(tokens, 'light')).toEqual(tokens);
    expect(resolveThemeTokensForMode(tokens, 'dark')).toEqual(tokens);
  });

  it('maps legacy color-bg to chat body and input when newer keys are absent', () => {
    const tokens = {
      'light-color-bg': '#eef2ff',
      'dark-color-bg': '#111827',
    };

    expect(resolveThemeTokensForMode(tokens, 'light')).toEqual({
      'color-chat-body-bg': '#eef2ff',
      'color-input-bg': '#eef2ff',
    });
    expect(resolveThemeTokensForMode(tokens, 'dark')).toEqual({
      'color-chat-body-bg': '#111827',
      'color-input-bg': '#111827',
    });
  });

  it('ignores legacy unprefixed color when prefixed keys exist for that token', () => {
    const tokens = {
      'color-chat-body-bg': '#legacy',
      'light-color-chat-body-bg': '#fafbfd',
      'dark-color-chat-body-bg': '#0b1220',
    };

    expect(resolveThemeTokensForMode(tokens, 'light')).toEqual({
      'color-chat-body-bg': '#fafbfd',
    });
    expect(resolveThemeTokensForMode(tokens, 'dark')).toEqual({
      'color-chat-body-bg': '#0b1220',
    });
  });

  it('passes through non-color custom tokens', () => {
    const tokens = {
      'light-color-surface': '#f4f6fa',
      'custom-radius': '12px',
    };

    expect(resolveThemeTokensForMode(tokens, 'light')).toEqual({
      'color-surface': '#f4f6fa',
      'custom-radius': '12px',
    });
  });
});

describe('resolveEffectiveThemeMode', () => {
  it('returns explicit light or dark modes', () => {
    expect(resolveEffectiveThemeMode('light', true)).toBe('light');
    expect(resolveEffectiveThemeMode('dark', false)).toBe('dark');
  });

  it('follows system preference when mode is system or unset', () => {
    expect(resolveEffectiveThemeMode('system', true)).toBe('dark');
    expect(resolveEffectiveThemeMode('system', false)).toBe('light');
    expect(resolveEffectiveThemeMode(undefined, true)).toBe('dark');
  });
});
