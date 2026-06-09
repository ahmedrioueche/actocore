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
});
