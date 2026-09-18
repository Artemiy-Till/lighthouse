import { Module } from '@nestjs/common';

import { MaxApiClient } from './max-api.client.js';
import { MaxIntegrationController } from './max-integration.controller.js';
import { MaxIntegrationService } from './max-integration.service.js';

@Module({
  controllers: [MaxIntegrationController],
  providers: [MaxApiClient, MaxIntegrationService],
})
export class MaxIntegrationModule {}
