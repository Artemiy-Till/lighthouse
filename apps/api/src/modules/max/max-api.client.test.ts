import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MaxApiClient, type MaxApiError } from './max-api.client';

function createClient(values: Record<string, unknown>) {
  return new MaxApiClient(
    new ConfigService({
      MAX_API_BASE_URL: 'https://platform-api2.max.ru',
      MAX_API_TIMEOUT_MS: 5000,
      ...values,
    }),
  );
}

describe('MaxApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the token only in the Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          first_name: 'Маяк',
          is_bot: true,
          user_id: 123,
          username: 'mayak_bot',
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const bot = await createClient({
      MAX_BOT_TOKEN: 'secret-token',
    }).getCurrentBot();

    expect(bot.username).toBe('mayak_bot');
    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe('https://platform-api2.max.ru/me');
    expect(options.headers).toEqual({
      Accept: 'application/json',
      Authorization: 'secret-token',
    });
    expect(url.toString()).not.toContain('secret-token');
  });

  it('reports invalid credentials without exposing the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    const request = createClient({
      MAX_BOT_TOKEN: 'secret-token',
    }).getCurrentBot();

    await expect(request).rejects.toMatchObject<Partial<MaxApiError>>({
      message: 'MAX API request failed: invalid_credentials',
      reason: 'invalid_credentials',
    });
    await expect(request).rejects.not.toThrow('secret-token');
  });
});
