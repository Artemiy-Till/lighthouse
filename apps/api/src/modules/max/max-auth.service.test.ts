import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MaxAuthService } from './max-auth.service.js';

const BOT_TOKEN = 'test-bot-token';
const NOW = new Date('2026-09-18T18:00:00.000Z');

function signMaxInitData(values: Record<string, string>) {
  const dataCheckString = Object.entries(values)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();
  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return new URLSearchParams({ ...values, hash }).toString();
}

function createService() {
  return new MaxAuthService(
    new ConfigService({
      MAX_BOT_TOKEN: BOT_TOKEN,
    }),
  );
}

describe('MaxAuthService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a normalized user from correctly signed launch data', () => {
    const initData = signMaxInitData({
      auth_date: String(Math.floor(NOW.getTime() / 1000)),
      query_id: 'request-1',
      user: JSON.stringify({
        first_name: 'Артемий',
        id: 123,
        language_code: 'ru',
        last_name: 'Тиль',
        username: 'artemiy',
      }),
    });

    expect(createService().authenticate(initData)).toEqual({
      authenticated: true,
      user: {
        firstName: 'Артемий',
        id: '123',
        languageCode: 'ru',
        lastName: 'Тиль',
        photoUrl: null,
        username: 'artemiy',
      },
    });
  });

  it('rejects data changed after signing', () => {
    const signedData = signMaxInitData({
      auth_date: String(Math.floor(NOW.getTime() / 1000)),
      user: JSON.stringify({ first_name: 'Артемий', id: 123 }),
    });
    const params = new URLSearchParams(signedData);
    params.set('user', JSON.stringify({ first_name: 'Иван', id: 123 }));

    expect(() => createService().authenticate(params.toString())).toThrow(
      'Invalid MAX launch data',
    );
  });

  it('rejects launch data older than one hour', () => {
    const initData = signMaxInitData({
      auth_date: String(Math.floor(NOW.getTime() / 1000) - 3601),
      user: JSON.stringify({ first_name: 'Артемий', id: 123 }),
    });

    expect(() => createService().authenticate(initData)).toThrow(
      'Expired MAX launch data',
    );
  });
});
