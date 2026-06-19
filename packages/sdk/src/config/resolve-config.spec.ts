import { describe, expect, it } from 'vitest';
import { resolveConfig } from './resolve-config';

describe('resolveConfig', () => {
  it('passes ui.header through to resolved config', () => {
    const resolved = resolveConfig({
      apiKey: 'test-key',
      ui: {
        header: { showIcon: false },
        launcher: { iconUrl: 'https://example.com/launcher.png' },
      },
    });

    expect(resolved.ui.header).toEqual({ showIcon: false });
  });

  it('resolves ui.loading defaults and custom values', () => {
    const defaults = resolveConfig({ apiKey: 'test-key' });
    expect(defaults.ui.loading).toEqual({
      initStyle: 'bar-and-centered',
      thinkingStyle: 'text',
      thinkingAnimation: 'ellipsis',
    });

    const custom = resolveConfig({
      apiKey: 'test-key',
      ui: {
        loading: {
          initStyle: 'none',
          thinkingStyle: 'dots',
          thinkingAnimation: 'none',
        },
      },
    });
    expect(custom.ui.loading).toEqual({
      initStyle: 'none',
      thinkingStyle: 'dots',
      thinkingAnimation: 'none',
    });
  });
});
