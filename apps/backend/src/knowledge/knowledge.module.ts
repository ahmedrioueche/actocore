import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsModule } from '../projects/projects.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeIngestService } from './knowledge-ingest.service';
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
    RagRetrievalService,
    QaRunnerService,
  ],
  exports: [KnowledgeService, QaRunnerService, RagRetrievalService],
})
export class KnowledgeModule {}
