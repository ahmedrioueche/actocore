export type VoiceSttProviderId = 'stub' | 'openai';

export interface VoiceTranscriptionData {
  text: string;
  provider: VoiceSttProviderId;
  language?: string;
}

export interface RuntimeVoiceConfig {
  /** True when backend can transcribe uploaded audio (OpenAI Whisper, etc.). */
  serverTranscription: boolean;
  sttProvider: VoiceSttProviderId;
}
