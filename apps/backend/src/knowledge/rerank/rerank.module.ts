import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { LlmResolvedConfig } from '../../config/llm.config';
import { CohereRerankProvider } from './cohere-rerank.provider';
import { NoopRerankProvider } from './noop-rerank.provider';
import {
  RERANK_PROVIDER,
  readRerankProviderName,
} from './rerank-provider.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    NoopRerankProvider,
    {
      provide: RERANK_PROVIDER,
      useFactory: (
        configService: ConfigService,
        noop: NoopRerankProvider,
      ) => {
        if (readRerankProviderName() !== 'cohere') {
          return noop;
        }

        const apiKey = process.env.COHERE_API_KEY?.trim();
        if (!apiKey) {
          return noop;
        }

        const llm = configService.get<LlmResolvedConfig>('llm');
        const model =
          process.env.COHERE_RERANK_MODEL?.trim() || 'rerank-english-v3.0';

        return new CohereRerankProvider(apiKey, llm?.timeoutMs ?? 30_000, model);
      },
      inject: [ConfigService, NoopRerankProvider],
    },
  ],
  exports: [RERANK_PROVIDER],
})
export class RerankModule {}
