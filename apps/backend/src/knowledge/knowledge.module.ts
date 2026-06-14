import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionsModule } from '../actions/actions.module';
import { StudioModule } from '../studio/studio.module';
import { ProjectsModule } from '../projects/projects.module';
import { LlmModule } from '../external/llm/llm.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { RerankModule } from './rerank/rerank.module';
import { KnowledgeController } from './knowledge.controller';
import { DocumentTextExtractor } from './document-text.extractor';
import { KnowledgeIngestService } from './knowledge-ingest.service';
import { KnowledgeIngestQueueService } from './knowledge-ingest.queue.service';
import { SitemapCrawlService } from './sitemap-crawl.service';
import { KnowledgeStorageService } from './knowledge-storage.service';
import { KnowledgeService } from './knowledge.service';
import { QaRunnerService } from './qa-runner.service';
import { RagQueryRewriteService } from './rag-query-rewrite.service';
import { RagRetrievalService } from './rag-retrieval.service';
import {
  KnowledgeChunk,
  KnowledgeChunkSchema,
} from './schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceSchema,
} from './schemas/knowledge-source.schema';

@Module({
  imports: [
    StudioModule,
    ActionsModule,
    MongooseModule.forFeature([
      { name: KnowledgeSource.name, schema: KnowledgeSourceSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
    ProjectsModule,
    LlmModule,
    EmbeddingModule,
    RerankModule,
  ],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    KnowledgeIngestService,
    KnowledgeIngestQueueService,
    KnowledgeStorageService,
    DocumentTextExtractor,
    SitemapCrawlService,
    RagRetrievalService,
    RagQueryRewriteService,
    QaRunnerService,
  ],
  exports: [KnowledgeService, QaRunnerService, RagRetrievalService],
})
export class KnowledgeModule {}
