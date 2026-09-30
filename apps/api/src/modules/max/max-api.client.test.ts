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

  it('adds a unique launch parameter to each mini app button', async () => {
    const requestMock = vi.fn().mockResolvedValue({ body: '{}', status: 200 });
    const client = createClient(
      { MAX_BOT_TOKEN: 'secret-token', MAX_BOT_USERNAME: 'mayak_bot' },
      { request: requestMock },
    );

    await client.sendUserMessage('42', 'Открой приложение', {
      openAppButton: true,
    });
    await client.sendUserMessage('42', 'Открой приложение', {
      openAppButton: true,
    });

    const messages = requestMock.mock.calls.map((call) =>
      JSON.parse((call[3] as { body: string }).body),
    ) as {
      attachments: {
        payload: { buttons: { payload: string; web_app: string }[][] };
      }[];
    }[];
    const firstButton = messages[0]?.attachments[0]?.payload.buttons[0]?.[0];
    const secondButton = messages[1]?.attachments[0]?.payload.buttons[0]?.[0];
    expect(firstButton).toMatchObject({
      payload: expect.stringMatching(/^refresh_[0-9a-f-]{36}$/),
      web_app: 'mayak_bot',
    });
    expect(secondButton?.payload).not.toBe(firstButton?.payload);
  });
});
