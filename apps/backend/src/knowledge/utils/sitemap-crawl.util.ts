import { JSDOM } from 'jsdom';

export interface SitemapCrawlLimits {
  maxPages: number;
  maxDepth: number;
}

export function parseSitemapDocument(xml: string): {
  pageUrls: string[];
  nestedSitemapUrls: string[];
} {
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const doc = dom.window.document;

  const pageUrls = [...doc.querySelectorAll('url > loc')]
    .map((node) => node.textContent?.trim() ?? '')
    .filter(Boolean);

  const nestedSitemapUrls = [...doc.querySelectorAll('sitemap > loc')]
    .map((node) => node.textContent?.trim() ?? '')
    .filter(Boolean);

  return { pageUrls, nestedSitemapUrls };
}

export async function discoverSitemapPageUrls(
  sitemapUrl: string,
  limits: SitemapCrawlLimits,
  fetchXml: (url: string) => Promise<string>,
): Promise<string[]> {
  const discovered = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: sitemapUrl, depth: 0 }];

  while (queue.length > 0 && discovered.size < limits.maxPages) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    const xml = await fetchXml(current.url);
    const { pageUrls, nestedSitemapUrls } = parseSitemapDocument(xml);

    for (const pageUrl of pageUrls) {
      if (discovered.size >= limits.maxPages) {
        break;
      }
      if (isHttpUrl(pageUrl)) {
        discovered.add(pageUrl);
      }
    }

    if (current.depth >= limits.maxDepth) {
      continue;
    }

    for (const nestedUrl of nestedSitemapUrls) {
      if (isHttpUrl(nestedUrl)) {
        queue.push({ url: nestedUrl, depth: current.depth + 1 });
      }
    }
  }

  return [...discovered];
}

export function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
