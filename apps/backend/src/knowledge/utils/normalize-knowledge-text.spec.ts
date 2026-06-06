import {
  normalizeKnowledgeText,
  truncateKnowledgeExcerpt,
} from './normalize-knowledge-text';

describe('normalizeKnowledgeText', () => {
  it('removes lines that are only bullets or page numbers', () => {
    const input = [
      'GymPro roles',
      '•',
      '•',
      '•',
      '5',
      'Features:',
      '• Read/unread tracking.',
    ].join('\n');

    expect(normalizeKnowledgeText(input)).toBe(
      'GymPro roles\nFeatures:\n• Read/unread tracking.',
    );
  });

  it('collapses horizontal whitespace within lines', () => {
    expect(normalizeKnowledgeText('Hello   world')).toBe('Hello world');
  });
});

describe('truncateKnowledgeExcerpt', () => {
  it('truncates at a word boundary when possible', () => {
    const text = 'Alpha beta gamma delta epsilon zeta eta theta iota kappa';
    const excerpt = truncateKnowledgeExcerpt(text, 30);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt).not.toContain('theta');
  });
});
