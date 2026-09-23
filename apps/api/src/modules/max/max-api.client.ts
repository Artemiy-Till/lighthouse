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

const maxChatSchema = z.object({
  chat_id: z.number().int(),
  link: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  type: z.enum(['chat', 'channel', 'dialog']),
});

export type MaxBotInfo = z.infer<typeof maxBotInfoSchema>;
export type MaxChat = z.infer<typeof maxChatSchema>;

export interface MaxTourChatButton {
  readonly description: string;
  readonly startPayload: string;
  readonly title: string;
}

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

  async sendTourChatButton(
    userId: string,
    chat: MaxTourChatButton,
  ): Promise<void> {
    await this.sendMessage(userId, {
      attachments: [
        {
          payload: {
            buttons: [
              [
                {
                  chat_description: chat.description,
                  chat_title: chat.title,
                  start_payload: chat.startPayload,
                  text: 'Создать чат экскурсии',
                  type: 'chat',
                },
              ],
            ],
          },
          type: 'inline_keyboard',
        },
      ],
      format: 'markdown',
      text: `На вашу экскурсию появилась запись. Создайте групповой чат «${chat.title}» — бот сам пришлёт ссылку всем участникам.`,
    });
  }

  async getChat(chatId: string): Promise<MaxChat> {
    const token = this.configService.get<string>('MAX_BOT_TOKEN');
    if (!token) throw new MaxApiError('invalid_credentials');

    const baseUrl = this.configService.get<string>(
      'MAX_API_BASE_URL',
      'https://platform-api2.max.ru',
    );
    const timeout = this.configService.get<number>('MAX_API_TIMEOUT_MS', 5000);
    const url = new URL(`/chats/${encodeURIComponent(chatId)}`, baseUrl);
    let response: Awaited<ReturnType<MaxApiTransport['request']>>;

    try {
      response = await this.transport.request(
        url,
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
      return maxChatSchema.parse(JSON.parse(response.body));
    } catch {
      throw new MaxApiError('invalid_response');
    }
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
