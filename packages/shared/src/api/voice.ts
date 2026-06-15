import { sdkApiPath } from '../config/api-version';
import type { ApiResponse } from '../types/api-response';
import type { VoiceTranscriptionData } from '../types/voice';
import { BaseApi } from './helper';

export class VoiceApi extends BaseApi {
  transcribe(
    audio: Blob,
    options?: { language?: string; filename?: string },
  ): Promise<ApiResponse<VoiceTranscriptionData>> {
    const form = new FormData();
    form.append('audio', audio, options?.filename ?? 'recording.webm');

    const params = new URLSearchParams();
    if (options?.language?.trim()) {
      params.set('language', options.language.trim());
    }
    const query = params.toString();
    const path = query
      ? `${sdkApiPath('voice/transcribe')}?${query}`
      : sdkApiPath('voice/transcribe');

    return this.request(() =>
      this.client.post<ApiResponse<VoiceTranscriptionData>>(path, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  }
}

export const voiceApi = new VoiceApi();
