import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
  MaxIntegrationService,
  type MaxIntegrationStatus,
} from './max-integration.service.js';

@ApiTags('integrations')
@Controller('integrations/max')
export class MaxIntegrationController {
  constructor(private readonly maxIntegrationService: MaxIntegrationService) {}

  @Get('status')
  @ApiOkResponse({
    description: 'MAX connection state without exposing credentials',
  })
  getStatus(): Promise<MaxIntegrationStatus> {
    return this.maxIntegrationService.getStatus();
  }

  @Post('webhook')
  @HttpCode(200)
  receiveWebhook(
    @Headers('x-max-bot-api-secret') secret: string | undefined,
    @Body() update: unknown,
  ): Promise<{ success: true }> {
    return this.maxIntegrationService.receiveWebhook(secret, update);
  }
}
