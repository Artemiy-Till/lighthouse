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
});
