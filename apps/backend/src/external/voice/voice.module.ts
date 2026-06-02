import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { VoiceResolvedConfig } from '../../config/voice.config';
import { OpenAiSttProvider } from './openai-stt.provider';
import { STT_PROVIDER } from './stt-provider.interface';
import { StubSttProvider } from './stub-stt.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    StubSttProvider,
    {
      provide: STT_PROVIDER,
      useFactory: (configService: ConfigService, stub: StubSttProvider) => {
        const voice = configService.get<VoiceResolvedConfig>('voice');
        if (voice?.sttProvider === 'openai' && voice.openai) {
          return new OpenAiSttProvider(voice.openai);
        }
        return stub;
      },
      inject: [ConfigService, StubSttProvider],
    },
  ],
  exports: [STT_PROVIDER],
})
export class VoiceModule {}
