import { describe, expect, it } from 'vitest';

import { parseEnvironment } from './environment';

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
  });

  it('rejects non-PostgreSQL database URLs', () => {
    expect(() =>
      parseEnvironment({ DATABASE_URL: 'mysql://localhost/app' }),
    ).toThrow();
  });
});
