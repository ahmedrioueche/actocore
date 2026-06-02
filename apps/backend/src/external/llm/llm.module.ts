import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { LlmResolvedConfig } from '../../config/llm.config';
import { createLlmProvider } from './llm-provider.factory';
import { LLM_PROVIDER } from './llm-provider.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LLM_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const llm = configService.get<LlmResolvedConfig>('llm');
        if (!llm) {
          throw new Error('LLM configuration is missing');
        }
        return createLlmProvider(llm);
      },
      inject: [ConfigService],
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
