import { chunkText, chunkTextWithParents, chunkTextWithParentsFromPages } from './text-chunker';

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    expect(chunkText('Hello world')).toEqual([
      { index: 0, content: 'Hello world' },
    ]);
  });

  it('splits long text into multiple chunks', () => {
    const text = 'word '.repeat(300).trim();
    const chunks = chunkText(text, { maxChars: 100, overlap: 20 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('splits markdown by headings and keeps headingPath metadata', () => {
    const text = [
      '# Billing',
      'Invoices are sent monthly.',
      '',
      '## Refunds',
      'Refunds take 5 business days.',
    ].join('\n');

    const chunks = chunkText(text, { sourceType: 'text' });

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.content).toContain('Invoices are sent monthly');
    expect(chunks[0]?.metadata?.headingPath).toEqual(['Billing']);
    expect(chunks[1]?.metadata?.headingPath).toEqual(['Billing', 'Refunds']);
    expect(chunks[0]?.metadata?.sourceType).toBe('text');
  });

  it('prefers paragraph boundaries before hard character splits', () => {
    const paragraphA = 'First paragraph sentence.';
    const paragraphB = 'Second paragraph sentence.';
    const text = `${paragraphA}\n\n${paragraphB}`;

    const chunks = chunkText(text, { maxChars: 120 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toContain(paragraphA);
    expect(chunks[0]?.content).toContain(paragraphB);
  });

  it('creates one parent with multiple children for long sections', () => {
    const intro = 'Section intro paragraph.';
    const body = 'Detail sentence. '.repeat(80).trim();
    const text = ['# Team', intro, '', body].join('\n');

    const groups = chunkTextWithParents(text, { maxChars: 120, overlap: 20 });

    expect(groups).toHaveLength(1);
    expect(groups[0]?.parentContent).toContain(intro);
    expect(groups[0]?.parentContent).toContain(body.slice(0, 20));
    expect(groups[0]?.children.length).toBeGreaterThan(1);
    expect(groups[0]?.metadata?.headingPath).toEqual(['Team']);
  });

  it('keeps page metadata when chunking paginated PDF text', () => {
    const groups = chunkTextWithParentsFromPages(
      [
        { page: 1, text: 'Intro on page one.' },
        { page: 2, text: 'Billing details on page two.' },
      ],
      { sourceType: 'document' },
    );

    expect(groups).toHaveLength(2);
    expect(groups[0]?.metadata?.page).toBe(1);
    expect(groups[1]?.metadata?.page).toBe(2);
    expect(groups[0]?.children[0]?.metadata?.page).toBe(1);
    expect(groups[1]?.children[0]?.metadata?.page).toBe(2);
    expect(groups[0]?.children[0]?.metadata?.sourceType).toBe('document');
  });
});
