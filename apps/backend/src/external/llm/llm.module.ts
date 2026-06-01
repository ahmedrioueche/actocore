import { Module } from '@nestjs/common';
import { LLM_PROVIDER } from './llm-provider.interface';
import { StubLlmProvider } from './stub-llm.provider';

@Module({
  providers: [
    StubLlmProvider,
    { provide: LLM_PROVIDER, useExisting: StubLlmProvider },
  ],
  exports: [LLM_PROVIDER, StubLlmProvider],
})
export class LlmModule {}
