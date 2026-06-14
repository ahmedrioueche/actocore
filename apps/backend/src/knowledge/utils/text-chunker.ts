import { normalizeKnowledgeText } from './normalize-knowledge-text';

export interface KnowledgeChunkBuildMetadata {
  headingPath?: string[];
  sourceType?: 'text' | 'url' | 'document' | 'sitemap';
  /** 1-based PDF page number when chunk came from a paginated document. */
  page?: number;
  /** Source page URL for sitemap crawls. */
  pageUrl?: string;
  /** App Layout page ids when chunk is page-scoped. */
  pageIds?: string[];
}

export interface TextChunk {
  index: number;
  content: string;
  metadata?: KnowledgeChunkBuildMetadata;
}

export interface ParentChildChunkSet {
  parentIndex: number;
  parentContent: string;
  metadata?: KnowledgeChunkBuildMetadata;
  children: TextChunk[];
}

export interface ChunkTextOptions {
  maxChars?: number;
  overlap?: number;
  sourceType?: KnowledgeChunkBuildMetadata['sourceType'];
}

export interface DocumentPageInput {
  page: number;
  text: string;
  pageUrl?: string;
}

const DEFAULT_CHILD_MAX_CHARS = 800;
const DEFAULT_OVERLAP = 150;
const MARKDOWN_HEADING = /^(#{1,6})\s+(.+)$/;

export function chunkTextWithParents(
  text: string,
  options?: ChunkTextOptions,
): ParentChildChunkSet[] {
  const childMaxChars = options?.maxChars ?? DEFAULT_CHILD_MAX_CHARS;
  const overlap = options?.overlap ?? DEFAULT_OVERLAP;
  const sourceType = options?.sourceType;
  const normalized = normalizeKnowledgeText(text);

  if (!normalized) {
    return [];
  }

  const sections = splitIntoSections(normalized);
  const sets: ParentChildChunkSet[] = [];
  let childIndex = 0;

  for (let parentIndex = 0; parentIndex < sections.length; parentIndex += 1) {
    const section = sections[parentIndex]!;
    const metadata = buildChunkMetadata(section.headingPath, sourceType);
    const childContents = splitSection(section.body, childMaxChars, overlap);
    const contents =
      childContents.length > 0 ? childContents : [section.body].filter(Boolean);

    if (contents.length === 0) {
      continue;
    }

    const children = contents.map((content) => {
      const child: TextChunk = {
        index: childIndex,
        content,
        ...(metadata ? { metadata } : {}),
      };
      childIndex += 1;
      return child;
    });

    sets.push({
      parentIndex,
      parentContent: section.body,
      ...(metadata ? { metadata } : {}),
      children,
    });
  }

  return sets;
}

/** Chunk PDF pages separately so each chunk keeps a stable page number. */
export function chunkTextWithParentsFromPages(
  pages: DocumentPageInput[],
  options?: ChunkTextOptions,
): ParentChildChunkSet[] {
  const sets: ParentChildChunkSet[] = [];
  let childIndex = 0;
  let parentIndex = 0;

  for (const pageEntry of pages) {
    const normalized = normalizeKnowledgeText(pageEntry.text);
    if (!normalized) {
      continue;
    }

    const pageSets = chunkTextWithParents(normalized, options).map((group) => {
      const metadata = buildChunkMetadata(
        group.metadata?.headingPath ?? [],
        options?.sourceType ?? group.metadata?.sourceType,
        pageEntry.page,
        pageEntry.pageUrl,
      );

      const children = group.children.map((child) => ({
        ...child,
        index: childIndex++,
        ...(metadata ? { metadata } : {}),
      }));

      return {
        ...group,
        parentIndex,
        ...(metadata ? { metadata } : {}),
        children,
      };
    });

    for (const group of pageSets) {
      sets.push({ ...group, parentIndex });
      parentIndex += 1;
    }
  }

  return sets;
}

/** Flat child chunks for callers that only need search units. */
export function chunkText(
  text: string,
  options?: ChunkTextOptions,
): TextChunk[] {
  return chunkTextWithParents(text, options).flatMap((set) => set.children);
}

function buildChunkMetadata(
  headingPath: string[],
  sourceType?: KnowledgeChunkBuildMetadata['sourceType'],
  page?: number,
  pageUrl?: string,
): KnowledgeChunkBuildMetadata | undefined {
  if (
    headingPath.length === 0 &&
    !sourceType &&
    page === undefined &&
    !pageUrl
  ) {
    return undefined;
  }

  return {
    ...(headingPath.length > 0 ? { headingPath } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(pageUrl ? { pageUrl } : {}),
  };
}

interface DocumentSection {
  headingPath: string[];
  body: string;
}

function splitIntoSections(text: string): DocumentSection[] {
  if (!looksLikeMarkdown(text)) {
    return [{ headingPath: [], body: text }];
  }

  const lines = text.split('\n');
  const sections: DocumentSection[] = [];
  const headingStack: Array<{ level: number; title: string }> = [];
  let bodyLines: string[] = [];

  const flush = () => {
    const body = bodyLines.join('\n').trim();
    if (body) {
      sections.push({
        headingPath: headingStack.map((entry) => entry.title),
        body,
      });
    }
    bodyLines = [];
  };

  for (const line of lines) {
    const match = line.match(MARKDOWN_HEADING);
    if (match) {
      flush();
      const level = match[1].length;
      const title = match[2].trim();
      while (
        headingStack.length > 0 &&
        headingStack[headingStack.length - 1].level >= level
      ) {
        headingStack.pop();
      }
      headingStack.push({ level, title });
      continue;
    }

    bodyLines.push(line);
  }

  flush();

  if (sections.length === 0) {
    return [{ headingPath: [], body: text }];
  }

  return sections;
}

function looksLikeMarkdown(text: string): boolean {
  return /^#{1,6}\s+\S/m.test(text);
}

function splitSection(
  text: string,
  maxChars: number,
  overlap: number,
): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return splitByCharacters(text, maxChars, overlap);
  }

  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      chunks.push(...splitByCharacters(paragraph, maxChars, overlap));
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current.trim());
    }
    current = paragraph;
  }

  if (current) {
    chunks.push(current.trim());
  }

  return chunks;
}

function splitByCharacters(
  text: string,
  maxChars: number,
  overlap: number,
): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const window = text.slice(start, end);
      const lastBreak = Math.max(
        window.lastIndexOf('\n\n'),
        window.lastIndexOf('\n'),
        window.lastIndexOf(' '),
      );
      if (lastBreak > maxChars * 0.5) {
        end = start + lastBreak;
      }
    }

    const content = text.slice(start, end).trim();
    if (content) {
      chunks.push(content);
    }

    if (end >= text.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}
