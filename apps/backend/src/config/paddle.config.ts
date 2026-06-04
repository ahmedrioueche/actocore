export type PaddleConfig = {
  apiKey: string;
  apiUrl: string;
  webhookSecret: string | null;
};

export function resolvePaddleConfig(): PaddleConfig {
  return {
    apiKey: process.env.PADDLE_API_KEY?.trim() || '',
    apiUrl: process.env.PADDLE_URL?.trim() || 'https://api.paddle.com',
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET?.trim() || null,
  };
}
