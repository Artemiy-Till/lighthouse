import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

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

  constructor(
    private readonly maxApiClient: MaxApiClient,
    private readonly configService: ConfigService,
  ) {}

  async receiveWebhook(
    suppliedSecret: string | undefined,
    update: unknown,
  ): Promise<{ success: true }> {
    const expectedSecret = this.configService.get<string>('MAX_WEBHOOK_SECRET');
    if (!expectedSecret || !suppliedSecret) throw new UnauthorizedException();
    const expected = Buffer.from(expectedSecret);
    const supplied = Buffer.from(suppliedSecret);
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      throw new UnauthorizedException();
    }

    if (!update || typeof update !== 'object') return { success: true };
    const event = update as Record<string, unknown>;
    let sender: Record<string, unknown> | undefined;
    if (event.update_type === 'bot_started') {
      sender = event.user as Record<string, unknown> | undefined;
    } else if (event.update_type === 'message_created') {
      const message = event.message as Record<string, unknown> | undefined;
      const recipient = message?.recipient as
        Record<string, unknown> | undefined;
      if (recipient?.chat_type && recipient.chat_type !== 'dialog') {
        return { success: true };
      }
      sender = message?.sender as Record<string, unknown> | undefined;
    }

    if (
      sender &&
      sender.is_bot !== true &&
      typeof sender.user_id === 'number' &&
      Number.isSafeInteger(sender.user_id) &&
      sender.user_id > 0
    ) {
      await this.maxApiClient.sendUserMessage(
        String(sender.user_id),
        'Привет! Я Маяк. Открой мини-приложение, чтобы выбрать поездку или впечатление.',
        { openAppButton: true },
      );
    }

    return { success: true };
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
