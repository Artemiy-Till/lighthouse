import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

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
  constructor(private readonly configService: ConfigService) {}

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

    let response: Response;

    try {
      response = await fetch(new URL('/me', baseUrl), {
        headers: {
          Accept: 'application/json',
          Authorization: token,
        },
        signal: AbortSignal.timeout(timeout),
      });
    } catch {
      throw new MaxApiError('unavailable');
    }

    if (response.status === 401) {
      throw new MaxApiError('invalid_credentials');
    }

    if (!response.ok) {
      throw new MaxApiError('unavailable');
    }

    try {
      return maxBotInfoSchema.parse(await response.json());
    } catch {
      throw new MaxApiError('invalid_response');
    }
  }
}
