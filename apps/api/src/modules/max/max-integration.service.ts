import { Injectable } from '@nestjs/common';

import {
  MaxApiClient,
  MaxApiError,
  type MaxApiFailureReason,
} from './max-api.client.js';

interface ConnectedMaxStatus {
  readonly bot: {
    readonly id: string;
    readonly name: string;
    readonly username: string | null;
  };
  readonly configured: true;
  readonly connected: true;
}

interface DisconnectedMaxStatus {
  readonly configured: boolean;
  readonly connected: false;
  readonly reason: 'not_configured' | MaxApiFailureReason;
}

export type MaxIntegrationStatus = ConnectedMaxStatus | DisconnectedMaxStatus;

@Injectable()
export class MaxIntegrationService {
  private cachedStatus?: {
    readonly expiresAt: number;
    readonly value: MaxIntegrationStatus;
  };

  constructor(private readonly maxApiClient: MaxApiClient) {}

  async getStatus(): Promise<MaxIntegrationStatus> {
    if (!this.maxApiClient.isConfigured()) {
      return {
        configured: false,
        connected: false,
        reason: 'not_configured',
      };
    }

    if (this.cachedStatus && this.cachedStatus.expiresAt > Date.now()) {
      return this.cachedStatus.value;
    }

    let status: MaxIntegrationStatus;

    try {
      const bot = await this.maxApiClient.getCurrentBot();
      status = {
        bot: {
          id: String(bot.user_id),
          name: bot.first_name,
          username: bot.username,
        },
        configured: true,
        connected: true,
      };
    } catch (error) {
      status = {
        configured: true,
        connected: false,
        reason: error instanceof MaxApiError ? error.reason : 'unavailable',
      };
    }

    this.cachedStatus = {
      expiresAt: Date.now() + 60_000,
      value: status,
    };

    return status;
  }
}
