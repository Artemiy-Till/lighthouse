import { Module } from '@nestjs/common';

import { MaxApiClient } from './max-api.client.js';
import { MaxApiTransport } from './max-api.transport.js';
import { MaxIntegrationController } from './max-integration.controller.js';
import { MaxIntegrationService } from './max-integration.service.js';

@Module({
  controllers: [MaxIntegrationController],
  providers: [MaxApiClient, MaxApiTransport, MaxIntegrationService],
})
export class MaxIntegrationModule {}
