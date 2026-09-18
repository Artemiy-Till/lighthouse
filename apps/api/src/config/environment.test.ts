import { describe, expect, it } from 'vitest';

import { parseEnvironment } from './environment.js';

describe('parseEnvironment', () => {
  it('parses a valid environment and normalizes CORS origins', () => {
    const environment = parseEnvironment({
      CORS_ORIGINS: 'https://app.example, https://admin.example ',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      PORT: '4000',
    });

    expect(environment.PORT).toBe(4000);
    expect(environment.CORS_ORIGINS).toEqual([
      'https://app.example',
      'https://admin.example',
    ]);
    expect(environment.MAX_API_BASE_URL).toBe('https://platform-api2.max.ru');
    expect(environment.MAX_API_TIMEOUT_MS).toBe(5000);
  });

  it('rejects non-PostgreSQL database URLs', () => {
    expect(() =>
      parseEnvironment({ DATABASE_URL: 'mysql://localhost/app' }),
    ).toThrow();
  });

  it('allows the API to start before persistence is configured', () => {
    expect(parseEnvironment({ NODE_ENV: 'production' }).DATABASE_URL).toBe(
      undefined,
    );
  });
});
