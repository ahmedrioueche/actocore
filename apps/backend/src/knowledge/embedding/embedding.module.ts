import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { EmbeddingResolvedConfig } from '../../config/embedding.config';
import { EMBEDDING_PROVIDER } from './embedding-provider.interface';
import { GoogleEmbeddingProvider } from './google-embedding.provider';
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
        const embedding =
          configService.getOrThrow<EmbeddingResolvedConfig>('embedding');
        const logger = new Logger('EmbeddingModule');

        if (embedding.provider === 'openai' && embedding.openai) {
          logger.log('Using OpenAI embedding provider');
          return new OpenAiEmbeddingProvider(
            embedding.openai,
            embedding.timeoutMs,
          );
        }

        if (embedding.provider === 'google' && embedding.google) {
          logger.log(
            `Using Google embedding provider (${embedding.google.model})`,
          );
          return new GoogleEmbeddingProvider(
            embedding.google,
            embedding.timeoutMs,
          );
        }

        return stub;
      },
      inject: [ConfigService, StubEmbeddingProvider],
    },
  ],
  exports: [EMBEDDING_PROVIDER],
})
export class EmbeddingModule {}
