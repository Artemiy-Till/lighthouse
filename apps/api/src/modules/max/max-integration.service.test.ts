import { describe, expect, it, vi } from 'vitest';

import { type MaxApiClient, MaxApiError } from './max-api.client';
import { MaxIntegrationService } from './max-integration.service';

describe('MaxIntegrationService', () => {
  it('reports when the server secret is not configured', async () => {
    const client = {
      isConfigured: () => false,
    } as MaxApiClient;

    await expect(
      new MaxIntegrationService(client).getStatus(),
    ).resolves.toEqual({
      configured: false,
      connected: false,
      reason: 'not_configured',
    });
  });

  it('returns public bot information for a valid token', async () => {
    const client = {
      getCurrentBot: vi.fn().mockResolvedValue({
        first_name: 'Маяк',
        is_bot: true,
        user_id: 123,
        username: 'mayak_bot',
      }),
      isConfigured: () => true,
    } as unknown as MaxApiClient;

    await expect(
      new MaxIntegrationService(client).getStatus(),
    ).resolves.toEqual({
      bot: { id: '123', name: 'Маяк', username: 'mayak_bot' },
      configured: true,
      connected: true,
    });
  });

  it('does not leak invalid credentials through the status endpoint', async () => {
    const client = {
      getCurrentBot: vi
        .fn()
        .mockRejectedValue(new MaxApiError('invalid_credentials')),
      isConfigured: () => true,
    } as unknown as MaxApiClient;

    await expect(
      new MaxIntegrationService(client).getStatus(),
    ).resolves.toEqual({
      configured: true,
      connected: false,
      reason: 'invalid_credentials',
    });
  });
});
