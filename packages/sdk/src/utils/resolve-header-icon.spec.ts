import { describe, expect, it } from 'vitest';
import { resolveHeaderIcon } from './resolve-header-icon';

describe('resolveHeaderIcon', () => {
  it('hides the icon when showIcon is false', () => {
    expect(
      resolveHeaderIcon({ showIcon: false }, { iconUrl: 'https://example.com/a.png' }),
    ).toEqual({ kind: 'hidden' });
  });

  it('uses header icon URL when set', () => {
    expect(
      resolveHeaderIcon(
        { iconUrl: 'https://example.com/header.png' },
        { iconUrl: 'https://example.com/launcher.png' },
      ),
    ).toEqual({ kind: 'url', url: 'https://example.com/header.png' });
  });

  it('falls back to launcher icon when header is not configured', () => {
    expect(
      resolveHeaderIcon(undefined, { iconUrl: 'https://example.com/launcher.png' }),
    ).toEqual({ kind: 'url', url: 'https://example.com/launcher.png' });
  });

  it('uses built-in default when header is configured without a URL', () => {
    expect(
      resolveHeaderIcon({ showIcon: true }, { iconUrl: 'https://example.com/launcher.png' }),
    ).toEqual({ kind: 'default' });
  });

  it('uses built-in default when no header or launcher URL is set', () => {
    expect(resolveHeaderIcon(undefined, undefined)).toEqual({ kind: 'default' });
  });
});
