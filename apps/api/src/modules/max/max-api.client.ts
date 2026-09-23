import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import { MaxApiTransport } from './max-api.transport.js';

const maxBotInfoSchema = z.object({
  first_name: z.string(),
  is_bot: z.literal(true),
  user_id: z.number().int(),
  username: z.string().nullable(),
});

export type MaxBotInfo = z.infer<typeof maxBotInfoSchema>;

export type MaxApiFailureReason =
  'invalid_credentials' | 'invalid_response' | 'unavailable';

export class MaxApiError extends Error {
  constructor(readonly reason: MaxApiFailureReason) {
    super(`MAX API request failed: ${reason}`);
    this.name = 'MaxApiError';
  }
}

@Injectable()
export class MaxApiClient {
  constructor(
    private readonly configService: ConfigService,
    private readonly transport: MaxApiTransport,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('MAX_BOT_TOKEN'));
  }

  async getCurrentBot(): Promise<MaxBotInfo> {
    const token = this.configService.get<string>('MAX_BOT_TOKEN');

    if (!token) {
      throw new MaxApiError('invalid_credentials');
    }

    const baseUrl = this.configService.get<string>(
      'MAX_API_BASE_URL',
      'https://platform-api2.max.ru',
    );
    const timeout = this.configService.get<number>('MAX_API_TIMEOUT_MS', 5000);

    let response: Awaited<ReturnType<MaxApiTransport['request']>>;

    try {
      response = await this.transport.request(
        new URL('/me', baseUrl),
        {
          Accept: 'application/json',
          Authorization: token,
        },
        timeout,
      );
    } catch {
      throw new MaxApiError('unavailable');
    }

    if (response.status === 401) {
      throw new MaxApiError('invalid_credentials');
    }

    if (response.status < 200 || response.status >= 300) {
      throw new MaxApiError('unavailable');
    }

    try {
      return maxBotInfoSchema.parse(JSON.parse(response.body));
    } catch {
      throw new MaxApiError('invalid_response');
    }
  }

  async sendUserMessage(userId: string, text: string): Promise<void> {
    await this.sendMessage(userId, { format: 'markdown', text });
  }

  private async sendMessage(
    userId: string,
    body: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const token = this.configService.get<string>('MAX_BOT_TOKEN');
    if (!token) throw new MaxApiError('invalid_credentials');

    const baseUrl = this.configService.get<string>(
      'MAX_API_BASE_URL',
      'https://platform-api2.max.ru',
    );
    const timeout = this.configService.get<number>('MAX_API_TIMEOUT_MS', 5000);
    const url = new URL('/messages', baseUrl);
    url.searchParams.set('user_id', userId);
    let response: Awaited<ReturnType<MaxApiTransport['request']>>;

    try {
      response = await this.transport.request(
        url,
        {
          Accept: 'application/json',
          Authorization: token,
          'Content-Type': 'application/json',
        },
        timeout,
        {
          body: JSON.stringify(body),
          method: 'POST',
        },
      );
    } catch {
      throw new MaxApiError('unavailable');
    }

    if (response.status === 401) {
      throw new MaxApiError('invalid_credentials');
    }
    if (response.status < 200 || response.status >= 300) {
      throw new MaxApiError('unavailable');
    }
  }
}
