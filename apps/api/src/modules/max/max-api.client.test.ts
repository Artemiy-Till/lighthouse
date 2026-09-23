import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { MaxApiClient, type MaxApiError } from './max-api.client.js';
import type { MaxApiTransport } from './max-api.transport.js';

function createClient(
  values: Record<string, unknown>,
  transport: Pick<MaxApiTransport, 'request'>,
) {
  return new MaxApiClient(
    new ConfigService({
      MAX_API_BASE_URL: 'https://platform-api2.max.ru',
      MAX_API_TIMEOUT_MS: 5000,
      ...values,
    }),
    transport,
  );
}

describe('MaxApiClient', () => {
  it('sends the token only in the Authorization header', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      body: JSON.stringify({
        first_name: 'Маяк',
        is_bot: true,
        user_id: 123,
        username: 'mayak_bot',
      }),
      status: 200,
    });

    const bot = await createClient(
      {
        MAX_BOT_TOKEN: 'secret-token',
      },
      { request: requestMock },
    ).getCurrentBot();

    expect(bot.username).toBe('mayak_bot');
    const [url, headers, timeout] = requestMock.mock.calls[0] as [
      URL,
      Record<string, string>,
      number,
    ];
    expect(url.toString()).toBe('https://platform-api2.max.ru/me');
    expect(headers).toEqual({
      Accept: 'application/json',
      Authorization: 'secret-token',
    });
    expect(timeout).toBe(5000);
    expect(url.toString()).not.toContain('secret-token');
  });

  it('reports invalid credentials without exposing the token', async () => {
    const requestMock = vi.fn().mockResolvedValue({ body: '', status: 401 });

    const request = createClient(
      {
        MAX_BOT_TOKEN: 'secret-token',
      },
      { request: requestMock },
    ).getCurrentBot();

    await expect(request).rejects.toMatchObject<Partial<MaxApiError>>({
      message: 'MAX API request failed: invalid_credentials',
      reason: 'invalid_credentials',
    });
    await expect(request).rejects.not.toThrow('secret-token');
  });

  it('sends a Markdown user mention to a MAX user', async () => {
    const requestMock = vi.fn().mockResolvedValue({ body: '{}', status: 200 });

    await createClient(
      { MAX_BOT_TOKEN: 'secret-token' },
      { request: requestMock },
    ).sendUserMessage('42', '[Мария](max://user/84)');

    const [url, headers, timeout, options] = requestMock.mock.calls[0] as [
      URL,
      Record<string, string>,
      number,
      { body: string; method: string },
    ];
    expect(url.toString()).toBe(
      'https://platform-api2.max.ru/messages?user_id=42',
    );
    expect(headers.Authorization).toBe('secret-token');
    expect(timeout).toBe(5000);
    expect(options).toEqual({
      body: JSON.stringify({
        format: 'markdown',
        text: '[Мария](max://user/84)',
      }),
      method: 'POST',
    });
  });

  it('sends the guide a button that creates a tour chat', async () => {
    const requestMock = vi.fn().mockResolvedValue({ body: '{}', status: 200 });

    await createClient(
      { MAX_BOT_TOKEN: 'secret-token' },
      { request: requestMock },
    ).sendTourChatButton('84', {
      description: 'Чат участников',
      startPayload: 'tour-chat:123',
      title: 'Казань · 10.10.2026 · 12:00',
    });

    const options = requestMock.mock.calls[0]?.[3] as { body: string };
    expect(JSON.parse(options.body)).toMatchObject({
      attachments: [
        {
          payload: {
            buttons: [
              [
                {
                  chat_title: 'Казань · 10.10.2026 · 12:00',
                  start_payload: 'tour-chat:123',
                  type: 'chat',
                },
              ],
            ],
          },
          type: 'inline_keyboard',
        },
      ],
    });
  });

  it('loads the invite link for a created chat', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      body: JSON.stringify({
        chat_id: 123,
        link: 'https://max.ru/join/example',
        title: 'Чат экскурсии',
        type: 'chat',
      }),
      status: 200,
    });

    const chat = await createClient(
      { MAX_BOT_TOKEN: 'secret-token' },
      { request: requestMock },
    ).getChat('123');

    expect(chat.link).toBe('https://max.ru/join/example');
    expect((requestMock.mock.calls[0]?.[0] as URL).toString()).toBe(
      'https://platform-api2.max.ru/chats/123',
    );
  });
});
