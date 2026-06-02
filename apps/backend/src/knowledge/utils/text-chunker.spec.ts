import { chunkText } from './text-chunker';

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
});
