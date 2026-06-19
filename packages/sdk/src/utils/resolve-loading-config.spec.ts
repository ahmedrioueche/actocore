import { describe, expect, it } from 'vitest';
import {
  initStyleShowsBar,
  initStyleShowsCloud,
  initStyleShowsInitBody,
  initStyleShowsInitText,
  resolveLoadingConfig,
} from './resolve-loading-config';

describe('resolveLoadingConfig', () => {
  it('returns SDK defaults when loading config is unset', () => {
    expect(resolveLoadingConfig(undefined)).toEqual({
      initStyle: 'bar-and-centered',
      thinkingStyle: 'text',
      thinkingAnimation: 'ellipsis',
    });
  });

  it('merges partial loading overrides', () => {
    expect(resolveLoadingConfig({ thinkingStyle: 'dots' })).toEqual({
      initStyle: 'bar-and-centered',
      thinkingStyle: 'dots',
      thinkingAnimation: 'ellipsis',
    });
  });
});

describe('init style helpers', () => {
  it('shows bar for all bar-based styles', () => {
    expect(initStyleShowsBar('bar-and-animation-text')).toBe(true);
    expect(initStyleShowsBar('centered')).toBe(false);
    expect(initStyleShowsBar('none')).toBe(false);
  });

  it('shows cloud animation for bar-and-animation variants and centered', () => {
    expect(initStyleShowsCloud('bar-and-animation')).toBe(true);
    expect(initStyleShowsCloud('bar-and-animation-text')).toBe(true);
    expect(initStyleShowsCloud('centered')).toBe(true);
    expect(initStyleShowsCloud('bar-and-centered')).toBe(false);
    expect(initStyleShowsCloud('bar-only')).toBe(false);
  });

  it('shows init body except bar-only and none', () => {
    expect(initStyleShowsInitBody('bar-only')).toBe(false);
    expect(initStyleShowsInitBody('bar-and-animation')).toBe(true);
  });

  it('shows init text for text-bearing styles', () => {
    expect(initStyleShowsInitText('bar-and-animation-text')).toBe(true);
    expect(initStyleShowsInitText('bar-and-animation')).toBe(false);
    expect(initStyleShowsInitText('bar-and-centered')).toBe(true);
  });
});
