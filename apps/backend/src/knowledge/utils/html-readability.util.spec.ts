import {
  extractReadableHtmlText,
  looksLikeHtml,
  stripHtml,
} from './html-readability.util';

const ARTICLE_HTML = `<!DOCTYPE html>
<html>
  <head><title>Marketing Site</title></head>
  <body>
    <nav>
      Home About Pricing Contact Sign up for our newsletter today
    </nav>
    <main>
      <article>
        <h1>ActoCore Overview</h1>
        <p>ActoCore is an AI integration layer for applications.</p>
        <h2>Billing</h2>
        <p>Use error code ERR-404 when a workspace is missing.</p>
      </article>
    </main>
    <footer>Copyright 2026. Subscribe to our newsletter for weekly updates.</footer>
  </body>
</html>`;

describe('html-readability.util', () => {
  const originalFlag = process.env.KNOWLEDGE_URL_READABILITY;

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.KNOWLEDGE_URL_READABILITY;
    } else {
      process.env.KNOWLEDGE_URL_READABILITY = originalFlag;
    }
  });

  it('detects HTML payloads', () => {
    expect(looksLikeHtml('<!doctype html><html><body>Hi</body></html>')).toBe(true);
    expect(looksLikeHtml('plain text only')).toBe(false);
  });

  it('strips tags with the fallback extractor', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('extracts the main article and preserves headings', () => {
    const text = extractReadableHtmlText(
      ARTICLE_HTML,
      'https://docs.example.com/overview',
    );

    expect(text).toContain('# ActoCore Overview');
    expect(text).toContain('ActoCore is an AI integration layer for applications.');
    expect(text).toContain('## Billing');
    expect(text).toContain('ERR-404');
    expect(text).not.toContain('Sign up for our newsletter today');
    expect(text).not.toContain('Subscribe to our newsletter');
  });

  it('falls back to tag stripping when readability is disabled', () => {
    process.env.KNOWLEDGE_URL_READABILITY = 'false';

    const text = extractReadableHtmlText(ARTICLE_HTML);

    expect(text).toContain('ActoCore is an AI integration layer for applications.');
    expect(text).toContain('Sign up for our newsletter today');
  });
});
