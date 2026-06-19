import 'reflect-metadata';

import {
  buildSdkCopyTranslateMessages,
  extractJsonObject,
  pickTranslatableSourceLabels,
  sanitizeTranslatedLabels,
  validateTranslateRequest,
} from './sdk-label-translate.util';

describe('sdk-label-translate.util', () => {
  it('picks only known label fields from source payload', () => {
    expect(
      pickTranslatableSourceLabels({
        headerTitle: ' Acme ',
        placeholder: 'Hi',
        unknown: 'skip',
        emptyTitle: '   ',
      }),
    ).toEqual({
      headerTitle: 'Acme',
      placeholder: 'Hi',
    });
  });

  it('validates locale and label requirements', () => {
    expect(() =>
      validateTranslateRequest('en', ['fr'], { headerTitle: 'Hi' }),
    ).not.toThrow();

    expect(() => validateTranslateRequest('invalid', ['fr'], { headerTitle: 'Hi' }))
      .toThrow('Invalid source locale');

    expect(() => validateTranslateRequest('en', ['en'], { headerTitle: 'Hi' }))
      .toThrow('Target locales must differ from the source locale');

    expect(() => validateTranslateRequest('en', ['fr'], {})).toThrow(
      'At least one source label',
    );
  });

  it('extracts JSON from fenced LLM output', () => {
    const raw = '```json\n{"fr":{"headerTitle":"Support"}}\n```';
    expect(extractJsonObject(raw)).toEqual({
      fr: { headerTitle: 'Support' },
    });
  });

  it('sanitizes translated labels per locale and field limits', () => {
    const result = sanitizeTranslatedLabels(
      {
        fr: {
          headerTitle: '  Support Acme  ',
          placeholder: 'Écrivez…',
          unknown: 'x',
        },
        de: { headerTitle: 'Hilfe' },
      },
      ['fr', 'de'],
      ['headerTitle', 'placeholder'],
    );

    expect(result).toEqual({
      fr: { headerTitle: 'Support Acme', placeholder: 'Écrivez…' },
      de: { headerTitle: 'Hilfe' },
    });
  });

  it('builds translate messages with target locales', () => {
    const messages = buildSdkCopyTranslateMessages('en', ['fr'], {
      headerTitle: 'Assistant',
    });

    expect(messages[0]?.role).toBe('system');
    expect(messages[1]?.content).toContain('Assistant');
    expect(messages[0]?.content).toContain('fr');
  });
});
