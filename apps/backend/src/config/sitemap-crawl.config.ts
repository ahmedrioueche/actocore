export interface SitemapCrawlResolvedConfig {
  maxPages: number;
  maxDepth: number;
  rateLimitMs: number;
  fetchTimeoutMs: number;
}

const DEFAULT_MAX_PAGES = 50;
const DEFAULT_MAX_DEPTH = 2;
const DEFAULT_RATE_LIMIT_MS = 500;
const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

export function resolveSitemapCrawlConfig(): SitemapCrawlResolvedConfig {
  return {
    maxPages: readPositiveInt(process.env.KNOWLEDGE_SITEMAP_MAX_PAGES, DEFAULT_MAX_PAGES),
    maxDepth: readPositiveInt(process.env.KNOWLEDGE_SITEMAP_MAX_DEPTH, DEFAULT_MAX_DEPTH),
    rateLimitMs: readPositiveInt(
      process.env.KNOWLEDGE_SITEMAP_RATE_LIMIT_MS,
      DEFAULT_RATE_LIMIT_MS,
    ),
    fetchTimeoutMs: readPositiveInt(
      process.env.KNOWLEDGE_SITEMAP_FETCH_TIMEOUT_MS,
      DEFAULT_FETCH_TIMEOUT_MS,
    ),
  };
}

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
