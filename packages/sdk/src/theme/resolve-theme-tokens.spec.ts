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
      'light-color-bg': '#ffffff',
      'dark-color-bg': '#0f172a',
      'light-color-primary': '#4f46e5',
      'dark-color-primary': '#6366f1',
      'font-family': 'Inter, sans-serif',
    };

    expect(resolveThemeTokensForMode(tokens, 'light')).toEqual({
      'color-bg': '#ffffff',
      'color-primary': '#4f46e5',
      'font-family': 'Inter, sans-serif',
    });

    expect(resolveThemeTokensForMode(tokens, 'dark')).toEqual({
      'color-bg': '#0f172a',
      'color-primary': '#6366f1',
      'font-family': 'Inter, sans-serif',
    });
  });

  it('falls back to legacy unprefixed tokens when no prefixed keys exist', () => {
    const tokens = {
      'color-bg': '#fafafa',
      'color-primary': '#111111',
    };

    expect(resolveThemeTokensForMode(tokens, 'light')).toEqual(tokens);
    expect(resolveThemeTokensForMode(tokens, 'dark')).toEqual(tokens);
  });

  it('ignores legacy unprefixed color when prefixed keys exist for that token', () => {
    const tokens = {
      'color-bg': '#legacy',
      'light-color-bg': '#ffffff',
      'dark-color-bg': '#0f172a',
    };

    expect(resolveThemeTokensForMode(tokens, 'light')).toEqual({
      'color-bg': '#ffffff',
    });
    expect(resolveThemeTokensForMode(tokens, 'dark')).toEqual({
      'color-bg': '#0f172a',
    });
  });

  it('passes through non-color custom tokens', () => {
    const tokens = {
      'light-color-bg': '#fff',
      'custom-radius': '12px',
    };

    expect(resolveThemeTokensForMode(tokens, 'light')).toEqual({
      'color-bg': '#fff',
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
