import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigModule } from '../config/app-config.module';
import { DatabaseModule } from '../database/database.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { RagRetrievalService } from './rag-retrieval.service';
import { RerankModule } from './rerank/rerank.module';
import {
  KnowledgeChunk,
  KnowledgeChunkSchema,
} from './schemas/knowledge-chunk.schema';

/** Minimal Nest module for the rag:eval CLI script. */
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
    EmbeddingModule,
    RerankModule,
  ],
  providers: [RagRetrievalService],
  exports: [RagRetrievalService],
})
export class RagEvalModule {}
