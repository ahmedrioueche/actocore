import { Injectable } from '@nestjs/common';
import type {
  DocumentExtractionResult,
  DocumentSectionText,
} from './document-extraction.types';
import { DocumentTextExtractor } from './document-text.extractor';
import { fetchUrlContent } from './url-content.fetcher';
import { resolveSitemapCrawlConfig } from '../config/sitemap-crawl.config';
import {
  discoverSitemapPageUrls,
  parseSitemapDocument,
  sleep,
  type SitemapCrawlLimits,
} from './utils/sitemap-crawl.util';

@Injectable()
export class SitemapCrawlService {
  constructor(private readonly documentText: DocumentTextExtractor) {}

  async crawlSitemap(sitemapUrl: string): Promise<DocumentExtractionResult> {
    const config = resolveSitemapCrawlConfig();
    const limits: SitemapCrawlLimits = {
      maxPages: config.maxPages,
      maxDepth: config.maxDepth,
    };

    const pageUrls = await discoverSitemapPageUrls(
      sitemapUrl,
      limits,
      (url) => this.fetchSitemapXml(url, config.fetchTimeoutMs),
    );

    if (pageUrls.length === 0) {
      throw new Error('Sitemap contains no crawlable page URLs');
    }

    const sections: DocumentSectionText[] = [];

    for (const pageUrl of pageUrls) {
      if (sections.length > 0) {
        await sleep(config.rateLimitMs);
      }

      try {
        const extraction = await fetchUrlContent(pageUrl, this.documentText, {
          timeoutMs: config.fetchTimeoutMs,
        });

        const text = extraction.text.trim();
        if (!text) {
          continue;
        }

        sections.push({
          pageUrl,
          text: formatSectionText(pageUrl, text),
        });
      } catch {
        continue;
      }
    }

    if (sections.length === 0) {
      throw new Error('No pages could be fetched from sitemap');
    }

    return {
      text: sections.map((section) => section.text).join('\n\n'),
      sections,
    };
  }

  private async fetchSitemapXml(url: string, timeoutMs: number): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap (${response.status})`);
      }

      return await response.text();
    } finally {
      clearTimeout(timer);
    }
  }
}

function formatSectionText(pageUrl: string, text: string): string {
  if (/^#\s+/m.test(text)) {
    return text;
  }

  return `# ${pageUrl}\n\n${text}`;
}

export { parseSitemapDocument };
