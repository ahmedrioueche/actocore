import {
  deepMergeSdkConfig,
  emptySdkProjectConfig,
  normalizeSdkConfig,
} from './sanitize-sdk-config.util';

describe('sanitize-sdk-config.util', () => {
  it('normalizes empty raw config', () => {
    expect(normalizeSdkConfig(null)).toEqual({ sdkConfigVersion: 0 });
  });

  it('normalizes widget launcher position', () => {
    expect(
      normalizeSdkConfig({
        sdkConfigVersion: 1,
        ui: {
          widget: {
            position: 'top-left',
            offsetX: '2rem',
            offsetY: '16px',
          },
        },
      }),
    ).toEqual({
      sdkConfigVersion: 1,
      ui: {
        widget: {
          position: 'top-left',
          offsetX: '2rem',
          offsetY: '16px',
        },
      },
    });
  });

  it('normalizes launcher placement and variant', () => {
    expect(
      normalizeSdkConfig({
        sdkConfigVersion: 1,
        ui: {
          launcher: {
            placement: 'host',
            variant: 'button',
            label: 'Ask AI',
          },
        },
      }),
    ).toEqual({
      sdkConfigVersion: 1,
      ui: {
        launcher: {
          placement: 'host',
          variant: 'button',
          label: 'Ask AI',
        },
      },
    });
  });

  it('deep merges patch sections', () => {
    const current = {
      ...emptySdkProjectConfig(),
      i18n: { locale: 'en' },
      ui: { showSources: true },
    };
    const merged = deepMergeSdkConfig(current, {
      i18n: { locale: 'fr' },
      theme: { mode: 'dark' },
    });
    expect(merged.i18n?.locale).toBe('fr');
    expect(merged.ui?.showSources).toBe(true);
    expect(merged.theme?.mode).toBe('dark');
  });

  it('deep merges ui.text and launcher without wiping on partial ui patch', () => {
    const current = {
      ...emptySdkProjectConfig(),
      ui: {
        text: { headerTitle: 'Help desk' },
        launcher: { iconUrl: 'https://example.com/icon.png' },
        widget: { panelLayout: 'dock-right' as const },
      },
    };

    const merged = deepMergeSdkConfig(current, {
      ui: {
        showSources: false,
        text: {},
        launcher: {},
        widget: {},
        inline: {},
      },
    });

    expect(merged.ui?.showSources).toBe(false);
    expect(merged.ui?.text?.headerTitle).toBe('Help desk');
    expect(merged.ui?.launcher?.iconUrl).toBe('https://example.com/icon.png');
    expect(merged.ui?.widget?.panelLayout).toBe('dock-right');
  });

  it('clears saved ui.text override when patch sends null', () => {
    const current = {
      ...emptySdkProjectConfig(),
      ui: {
        text: { headerTitle: 'Custom title', placeholder: 'Ask anything' },
      },
    };

    const merged = deepMergeSdkConfig(current, {
      ui: {
        showSources: true,
        showIntentBadge: false,
        showActionsHint: false,
        showActionPicker: false,
        composerMinRows: 1,
        composerMaxRows: 6,
        text: { headerTitle: null },
      },
    });

    expect(merged.ui?.text?.headerTitle).toBeUndefined();
    expect(merged.ui?.text?.placeholder).toBe('Ask anything');
  });

  it('deep merges ui.header without wiping launcher', () => {
    const current = {
      ...emptySdkProjectConfig(),
      ui: {
        header: { iconUrl: 'https://example.com/old.png' },
        launcher: { iconUrl: 'https://example.com/launcher.png' },
      },
    };

    const merged = deepMergeSdkConfig(current, {
      ui: {
        showSources: true,
        showIntentBadge: false,
        showActionsHint: false,
        showActionPicker: false,
        composerMinRows: 1,
        composerMaxRows: 6,
        header: { showIcon: false },
      },
    });

    expect(merged.ui?.header?.iconUrl).toBe('https://example.com/old.png');
    expect(merged.ui?.header?.showIcon).toBe(false);
    expect(merged.ui?.launcher?.iconUrl).toBe('https://example.com/launcher.png');
  });

  it('clears saved header iconUrl when patch sends null', () => {
    const current = {
      ...emptySdkProjectConfig(),
      ui: {
        header: { iconUrl: 'https://example.com/icon.png', showIcon: true },
      },
    };

    const merged = deepMergeSdkConfig(current, {
      ui: {
        showSources: true,
        showIntentBadge: false,
        showActionsHint: false,
        showActionPicker: false,
        composerMinRows: 1,
        composerMaxRows: 6,
        header: { iconUrl: null },
      },
    });

    expect(merged.ui?.header?.iconUrl).toBeUndefined();
    expect(merged.ui?.header?.showIcon).toBe(true);
  });
});
