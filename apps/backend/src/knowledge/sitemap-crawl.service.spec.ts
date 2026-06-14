import { Test } from '@nestjs/testing';
import { DocumentTextExtractor } from './document-text.extractor';
import { SitemapCrawlService } from './sitemap-crawl.service';
import * as sitemapUtil from './utils/sitemap-crawl.util';
import * as urlFetcher from './url-content.fetcher';

describe('SitemapCrawlService', () => {
  let service: SitemapCrawlService;

  beforeEach(async () => {
    jest.restoreAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [SitemapCrawlService, DocumentTextExtractor],
    }).compile();

    service = moduleRef.get(SitemapCrawlService);
  });

  it('crawls discovered pages with rate limiting', async () => {
    jest.spyOn(sitemapUtil, 'discoverSitemapPageUrls').mockResolvedValue([
      'https://docs.example.com/overview',
      'https://docs.example.com/billing',
    ]);
    jest.spyOn(sitemapUtil, 'sleep').mockResolvedValue(undefined);
    jest.spyOn(urlFetcher, 'fetchUrlContent').mockImplementation(async (url) => ({
      text:
        url.endsWith('/billing')
          ? 'Billing details and ERR-404 guidance.'
          : 'ActoCore is an AI integration layer.',
    }));

    const result = await service.crawlSitemap('https://docs.example.com/sitemap.xml');

    expect(result.sections).toHaveLength(2);
    expect(result.text).toContain('ActoCore is an AI integration layer');
    expect(result.text).toContain('ERR-404');
    expect(sitemapUtil.sleep).toHaveBeenCalledTimes(1);
  });
});
