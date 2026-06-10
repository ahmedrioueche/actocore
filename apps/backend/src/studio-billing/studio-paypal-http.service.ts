import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { PayPalConfig } from '../config/paypal.config';

type PayPalTokenCache = {
  token: string;
  expiresAt: number;
};

@Injectable()
export class StudioPayPalHttpService {
  private tokenCache: PayPalTokenCache | null = null;

  constructor(private readonly config: ConfigService) {}

  private cfg(): PayPalConfig {
    return this.config.getOrThrow<PayPalConfig>('paypal');
  }

  isConfigured(): boolean {
    const { clientId, clientSecret } = this.cfg();
    return Boolean(clientId && clientSecret);
  }

  ensureConfigured(): void {
    if (!this.isConfigured()) {
      throw new BadRequestException({
        errorCode: ErrorCode.BILLING_NOT_CONFIGURED,
        message: 'PayPal is not configured',
      });
    }
  }

  async getAccessToken(): Promise<string> {
    this.ensureConfigured();
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60_000) {
      return this.tokenCache.token;
    }

    const { clientId, clientSecret, apiBaseUrl } = this.cfg();
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );
    const response = await axios.post(
      `${apiBaseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const token = response.data.access_token as string;
    const expiresIn = Number(response.data.expires_in ?? 3600);
    this.tokenCache = {
      token,
      expiresAt: now + expiresIn * 1000,
    };
    return token;
  }

  async billingApiRequest<T>(
    method: 'get' | 'post' | 'patch',
    path: string,
    body?: unknown,
    requestId?: string,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const { apiBaseUrl } = this.cfg();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (requestId) {
      headers['PayPal-Request-Id'] = requestId;
    }

    const response = await axios.request<T>({
      method,
      url: `${apiBaseUrl}${path}`,
      headers,
      data: body,
    });
    return response.data;
  }
}
