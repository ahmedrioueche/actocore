import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { CreateKnowledgeSourceDto } from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { DocumentTextExtractor } from './document-text.extractor';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from './embedding/embedding-provider.interface';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from './schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceDocument,
} from './schemas/knowledge-source.schema';
import { isPdfBuffer } from './utils/knowledge-mime.util';
import { chunkText } from './utils/text-chunker';

export interface KnowledgeUploadedFile {
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
}

@Injectable()
export class KnowledgeIngestService {
  constructor(
    @InjectModel(KnowledgeSource.name)
    private readonly sourceModel: Model<KnowledgeSourceDocument>,
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddings: EmbeddingProvider,
    private readonly documentText: DocumentTextExtractor,
  ) {}

  async ingestSource(
    source: KnowledgeSourceDocument,
    body: CreateKnowledgeSourceDto,
  ): Promise<KnowledgeSourceDocument> {
    try {
      const text = await this.resolveSourceText(body);
      return await this.ingestExtractedText(source, text);
    } catch (error) {
      return await this.markIngestError(source, error);
    }
  }

  async ingestUploadedFile(
    source: KnowledgeSourceDocument,
    file: KnowledgeUploadedFile,
  ): Promise<KnowledgeSourceDocument> {
    try {
      const text = await this.documentText.extractText(
        file.buffer,
        file.mimeType,
        file.originalFilename,
      );
      return await this.ingestExtractedText(source, text);
    } catch (error) {
      return await this.markIngestError(source, error);
    }
  }

  private async ingestExtractedText(
    source: KnowledgeSourceDocument,
    text: string,
  ): Promise<KnowledgeSourceDocument> {
    await this.chunkModel.deleteMany({
      projectId: source.projectId,
      sourceId: source._id,
    });

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      throw new BadRequestException('Knowledge source has no indexable text');
    }

    for (const chunk of chunks) {
      const embedding = await this.embeddings.embed(chunk.content);
      await this.chunkModel.create({
        projectId: source.projectId,
        sourceId: source._id,
        sourceTitle: source.title,
        chunkIndex: chunk.index,
        content: chunk.content,
        embedding,
      });
    }

    source.status = 'ready';
    source.chunkCount = chunks.length;
    source.errorMessage = undefined;
    await source.save();
    return source;
  }

  private async markIngestError(
    source: KnowledgeSourceDocument,
    error: unknown,
  ): Promise<KnowledgeSourceDocument> {
    source.status = 'error';
    source.errorMessage =
      error instanceof Error ? error.message : 'Ingestion failed';
    source.chunkCount = 0;
    await source.save();
    return source;
  }

  private async resolveSourceText(
    body: CreateKnowledgeSourceDto,
  ): Promise<string> {
    if (body.type === 'text') {
      if (!body.content?.trim()) {
        throw new BadRequestException('content is required for text sources');
      }
      return body.content.trim();
    }

    if (body.type === 'url') {
      if (!body.url?.trim()) {
        throw new BadRequestException('url is required for url sources');
      }
      return this.fetchUrlText(body.url.trim());
    }

    throw new BadRequestException(
      'document type requires file upload; use POST .../knowledge/upload',
    );
  }

  private async fetchUrlText(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch URL (${response.status})`);
      }

      const contentType =
        response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ??
        '';

      const buffer = Buffer.from(await response.arrayBuffer());

      if (contentType.includes('pdf') || isPdfBuffer(buffer)) {
        return this.documentText.extractText(
          buffer,
          'application/pdf',
          'remote.pdf',
        );
      }

      const asText = buffer.toString('utf8');
      if (contentType.includes('html') || looksLikeHtml(asText)) {
        return stripHtml(asText);
      }

      return asText.trim();
    } finally {
      clearTimeout(timer);
    }
  }
}

function looksLikeHtml(text: string): boolean {
  const sample = text.slice(0, 512).toLowerCase();
  return sample.includes('<html') || sample.includes('<!doctype');
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
