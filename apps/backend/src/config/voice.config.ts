import { getAppEnvironment } from './mongodb.config';

export type VoiceSttProviderId = 'stub' | 'openai';

const ALLOWED: VoiceSttProviderId[] = ['stub', 'openai'];

export interface OpenAiSttConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface VoiceResolvedConfig {
  sttProvider: VoiceSttProviderId;
  maxAudioBytes: number;
  openai: OpenAiSttConfig | null;
}

function parseProvider(): VoiceSttProviderId {
  const raw = (
    process.env.VOICE_STT_PROVIDER?.trim().toLowerCase() || 'stub'
  ) as VoiceSttProviderId;
  if (!ALLOWED.includes(raw)) {
    throw new Error(`VOICE_STT_PROVIDER must be one of: ${ALLOWED.join(', ')}`);
  }
  return raw;
}

function parseMaxAudioBytes(): number {
  const raw = process.env.VOICE_MAX_AUDIO_BYTES?.trim() ?? String(10 * 1024 * 1024);
  const bytes = Number(raw);
  if (!Number.isInteger(bytes) || bytes < 1024 || bytes > 25 * 1024 * 1024) {
    throw new Error(
      'VOICE_MAX_AUDIO_BYTES must be an integer between 1024 and 26214400',
    );
  }
  return bytes;
}

function requireOpenAiKey(): string {
  const key =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.VOICE_OPENAI_API_KEY?.trim();
  if (key) {
    return key;
  }
  const message =
    'OPENAI_API_KEY (or VOICE_OPENAI_API_KEY) is required when VOICE_STT_PROVIDER=openai';
  if (getAppEnvironment() === 'production') {
    throw new Error(message);
  }
  throw new Error(message);
}

export function resolveVoiceConfig(): VoiceResolvedConfig {
  const sttProvider = parseProvider();
  const maxAudioBytes = parseMaxAudioBytes();

  if (sttProvider === 'openai') {
    return {
      sttProvider,
      maxAudioBytes,
      openai: {
        apiKey: requireOpenAiKey(),
        model: process.env.VOICE_OPENAI_MODEL?.trim() || 'whisper-1',
        baseUrl:
          process.env.OPENAI_BASE_URL?.trim() ||
          'https://api.openai.com/v1',
      },
    };
  }

  return { sttProvider, maxAudioBytes, openai: null };
}
