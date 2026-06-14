/** One page of text extracted from a PDF (1-based page numbers). */
export interface DocumentPageText {
  page: number;
  text: string;
  pageUrl?: string;
}

/** Section extracted from a crawled web page. */
export interface DocumentSectionText {
  text: string;
  pageUrl?: string;
  page?: number;
}

export interface DocumentExtractionResult {
  text: string;
  /** Present when the source is a PDF with per-page text. */
  pages?: DocumentPageText[];
  /** Present when the source is a sitemap crawl with per-URL sections. */
  sections?: DocumentSectionText[];
}
