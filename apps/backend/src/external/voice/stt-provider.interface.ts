export const STT_PROVIDER = Symbol('STT_PROVIDER');

export interface SttTranscriptionInput {
  audio: Buffer;
  mimeType: string;
  language?: string;
}

export interface SttProvider {
  transcribe(input: SttTranscriptionInput): Promise<string>;
}
