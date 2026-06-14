import {
  discoverSitemapPageUrls,
  parseSitemapDocument,
} from './sitemap-crawl.util';

const URLSET_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://docs.example.com/overview</loc></url>
  <url><loc>https://docs.example.com/billing</loc></url>
</urlset>`;

const INDEX_XML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://docs.example.com/sitemap-pages.xml</loc></sitemap>
</sitemapindex>`;

describe('sitemap-crawl.util', () => {
  it('parses page URLs from a sitemap urlset', () => {
    const parsed = parseSitemapDocument(URLSET_XML);

    expect(parsed.pageUrls).toEqual([
      'https://docs.example.com/overview',
      'https://docs.example.com/billing',
    ]);
    expect(parsed.nestedSitemapUrls).toEqual([]);
  });

  it('parses nested sitemap indexes', () => {
    const parsed = parseSitemapDocument(INDEX_XML);

    expect(parsed.pageUrls).toEqual([]);
    expect(parsed.nestedSitemapUrls).toEqual([
      'https://docs.example.com/sitemap-pages.xml',
    ]);
  });

  it('discovers page URLs from nested sitemaps with depth limits', async () => {
    const fetched = new Set<string>();
    const fetchXml = jest.fn(async (url: string) => {
      fetched.add(url);
      if (url.endsWith('sitemap.xml')) {
        return INDEX_XML;
      }
      return URLSET_XML;
    });

    const urls = await discoverSitemapPageUrls(
      'https://docs.example.com/sitemap.xml',
      { maxPages: 10, maxDepth: 1 },
      fetchXml,
    );

    expect(urls).toEqual([
      'https://docs.example.com/overview',
      'https://docs.example.com/billing',
    ]);
    expect(fetched.has('https://docs.example.com/sitemap.xml')).toBe(true);
    expect(fetched.has('https://docs.example.com/sitemap-pages.xml')).toBe(true);
  });

  it('caps discovered URLs at maxPages', async () => {
    const fetchXml = jest.fn(async () => URLSET_XML);

    const urls = await discoverSitemapPageUrls(
      'https://docs.example.com/sitemap.xml',
      { maxPages: 1, maxDepth: 0 },
      fetchXml,
    );

    expect(urls).toHaveLength(1);
  });
});
