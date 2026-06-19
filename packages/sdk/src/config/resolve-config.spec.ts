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
});
