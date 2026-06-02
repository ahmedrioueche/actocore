import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { LlmResolvedConfig } from '../../config/llm.config';
import { EMBEDDING_PROVIDER } from './embedding-provider.interface';
import { OpenAiEmbeddingProvider } from './openai-embedding.provider';
import { StubEmbeddingProvider } from './stub-embedding.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    StubEmbeddingProvider,
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: (
        configService: ConfigService,
        stub: StubEmbeddingProvider,
      ) => {
        const llm = configService.get<LlmResolvedConfig>('llm');
        const provider = process.env.EMBEDDING_PROVIDER?.trim().toLowerCase();

        if (provider === 'openai' && llm?.openai) {
          return new OpenAiEmbeddingProvider(llm.openai, llm.timeoutMs);
        }

        return stub;
      },
      inject: [ConfigService, StubEmbeddingProvider],
    },
  ],
  exports: [EMBEDDING_PROVIDER],
})
export class EmbeddingModule {}
