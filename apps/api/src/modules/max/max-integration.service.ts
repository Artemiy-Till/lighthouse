import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';

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
export class MaxIntegrationService implements OnModuleInit {
  private cachedStatus?: {
    readonly expiresAt: number;
    readonly value: MaxIntegrationStatus;
  };

  constructor(
    private readonly maxApiClient: MaxApiClient,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const webhookUrl = this.configService.get<string>('MAX_WEBHOOK_URL');
    if (!webhookUrl || !this.maxApiClient.isConfigured()) return;

    await this.maxApiClient
      .ensureWebhookSubscription(webhookUrl, this.getWebhookSecret())
      .catch(() => undefined);
  }

  isValidWebhookSecret(receivedSecret?: string) {
    if (!receivedSecret || !this.maxApiClient.isConfigured()) return false;
    const received = Buffer.from(receivedSecret);
    const expected = Buffer.from(this.getWebhookSecret());
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  }

  private getWebhookSecret() {
    const configured = this.configService.get<string>('MAX_WEBHOOK_SECRET');
    if (configured) return configured;
    const botToken = this.configService.get<string>('MAX_BOT_TOKEN', '');
    return createHash('sha256')
      .update(`max-tour-chat-webhook:${botToken}`)
      .digest('hex');
  }

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
