import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { normalizeKnowledgeText } from './normalize-knowledge-text';

const MIN_READABLE_CHARS = 80;

export function isUrlReadabilityEnabled(): boolean {
  const raw = process.env.KNOWLEDGE_URL_READABILITY?.trim().toLowerCase();
  return raw !== 'false';
}

export function htmlContentToStructuredText(contentHtml: string): string {
  return htmlArticleContentToText(contentHtml);
}

/** Extract main article text from HTML; falls back to naive tag stripping. */
export function extractReadableHtmlText(html: string, pageUrl?: string): string {
  if (!isUrlReadabilityEnabled()) {
    return normalizeKnowledgeText(stripHtml(html));
  }

  const article = parseReadableArticle(html, pageUrl);
  if (!article) {
    return normalizeKnowledgeText(stripHtml(html));
  }

  const fromContent = article.content
    ? htmlArticleContentToText(article.content)
    : '';
  const candidate = fromContent.trim() || article.textContent?.trim() || '';

  if (candidate.length >= MIN_READABLE_CHARS) {
    return normalizeKnowledgeText(candidate);
  }

  return normalizeKnowledgeText(stripHtml(html));
}

function parseReadableArticle(html: string, pageUrl?: string) {
  try {
    const dom = new JSDOM(html, { url: pageUrl ?? 'https://example.com/' });
    const reader = new Readability(dom.window.document);
    return reader.parse();
  } catch {
    return null;
  }
}

function htmlArticleContentToText(contentHtml: string): string {
  const dom = new JSDOM(`<body>${contentHtml}</body>`);
  const body = dom.window.document.body;

  return serializeReadableElement(body).trim();
}

function serializeReadableElement(element: Element): string {
  const chunks: string[] = [];
  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;

  for (const node of element.childNodes) {
    if (node.nodeType === TEXT_NODE) {
      const text = node.textContent?.replace(/\s+/g, ' ').trim();
      if (text) {
        chunks.push(text);
      }
      continue;
    }

    if (node.nodeType !== ELEMENT_NODE) {
      continue;
    }

    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const inner = serializeReadableElement(el);

    if (!inner) {
      continue;
    }

    if (/^h[1-6]$/.test(tag)) {
      const level = Number.parseInt(tag.slice(1), 10);
      chunks.push(`${'#'.repeat(level)} ${inner}`);
      continue;
    }

    if (tag === 'li') {
      chunks.push(`- ${inner}`);
      continue;
    }

    if (tag === 'br') {
      chunks.push('');
      continue;
    }

    if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article') {
      chunks.push(inner);
      continue;
    }

    chunks.push(inner);
  }

  return chunks.filter(Boolean).join('\n\n');
}

export function looksLikeHtml(text: string): boolean {
  const sample = text.slice(0, 512).toLowerCase();
  return sample.includes('<html') || sample.includes('<!doctype');
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
