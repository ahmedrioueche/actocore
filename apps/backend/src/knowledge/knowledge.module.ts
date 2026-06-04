import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudioModule } from '../studio/studio.module';
import { ProjectsModule } from '../projects/projects.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { KnowledgeController } from './knowledge.controller';
import { DocumentTextExtractor } from './document-text.extractor';
import { KnowledgeIngestService } from './knowledge-ingest.service';
import { KnowledgeStorageService } from './knowledge-storage.service';
import { KnowledgeService } from './knowledge.service';
import { QaRunnerService } from './qa-runner.service';
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
    MongooseModule.forFeature([
      { name: KnowledgeSource.name, schema: KnowledgeSourceSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
    ProjectsModule,
    EmbeddingModule,
  ],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    KnowledgeIngestService,
    KnowledgeStorageService,
    DocumentTextExtractor,
    RagRetrievalService,
    QaRunnerService,
  ],
  exports: [KnowledgeService, QaRunnerService, RagRetrievalService],
})
export class KnowledgeModule {}
