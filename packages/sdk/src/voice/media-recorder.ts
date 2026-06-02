export interface AudioRecordingSession {
  stop: () => Promise<Blob>;
}

export async function startAudioRecording(): Promise<AudioRecordingSession> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone is not available in this environment');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  recorder.start();

  return {
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        recorder.addEventListener(
          'stop',
          () => {
            stream.getTracks().forEach((t) => t.stop());
            resolve(new Blob(chunks, { type: mimeType }));
          },
          { once: true },
        );
        recorder.addEventListener(
          'error',
          () => {
            stream.getTracks().forEach((t) => t.stop());
            reject(new Error('Recording failed'));
          },
          { once: true },
        );
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }),
  };
}
