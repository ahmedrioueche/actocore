import { Injectable } from '@nestjs/common';
import type { OpenAiSttConfig } from '../../config/voice.config';
import { LlmHttpError } from '../llm/llm-http';
import type { SttProvider, SttTranscriptionInput } from './stt-provider.interface';

interface OpenAiTranscriptionResponse {
  text?: string;
}

@Injectable()
export class OpenAiSttProvider implements SttProvider {
  constructor(private readonly config: OpenAiSttConfig) {}

  async transcribe(input: SttTranscriptionInput): Promise<string> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/audio/transcriptions`;
    const extension = mimeToExtension(input.mimeType);
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(input.audio)], { type: input.mimeType }),
      `audio.${extension}`,
    );
    form.append('model', this.config.model);
    if (input.language?.trim()) {
      form.append('language', input.language.trim());
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
      body: form,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new LlmHttpError(response.status, text);
    }

    let parsed: OpenAiTranscriptionResponse;
    try {
      parsed = JSON.parse(text) as OpenAiTranscriptionResponse;
    } catch {
      throw new LlmHttpError(response.status, text);
    }

    const transcript = parsed.text?.trim();
    if (!transcript) {
      throw new Error('Transcription returned empty text');
    }

    return transcript;
  }
}

function mimeToExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('webm')) return 'webm';
  if (normalized.includes('ogg')) return 'ogg';
  if (normalized.includes('mp4') || normalized.includes('m4a')) return 'm4a';
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3';
  if (normalized.includes('wav')) return 'wav';
  return 'webm';
}
