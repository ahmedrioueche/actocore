import { Injectable } from '@nestjs/common';
import type { SttProvider, SttTranscriptionInput } from './stt-provider.interface';

/** Deterministic placeholder for local dev and tests. */
@Injectable()
export class StubSttProvider implements SttProvider {
  async transcribe(_input: SttTranscriptionInput): Promise<string> {
    return 'What is ActoCore?';
  }
}
